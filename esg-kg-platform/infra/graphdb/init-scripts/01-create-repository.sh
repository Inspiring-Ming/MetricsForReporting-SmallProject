#!/bin/bash

# GraphDB Repository Initialization Script
# This script automatically creates the ESG repository when GraphDB starts
# and imports initial ESG knowledge graph data

set -e

echo "Starting GraphDB repository initialization..."

# Configuration
GRAPHDB_URL="http://graphdb:7200"
REPOSITORY_ID="esg-repo"
ADMIN_USER="admin"
ADMIN_PASS="admin"
INIT_DATA_FILE="/opt/graphdb/home/graphdb-import/esg_knowledge_graph_init.ttl"

# Wait for GraphDB to be ready
echo "Waiting for GraphDB to be available..."
until curl -s -f "$GRAPHDB_URL/rest/repositories" > /dev/null; do
    echo "GraphDB not ready yet, waiting..."
    sleep 5
done

echo "GraphDB is ready!"

# Check if repository already exists
if curl -s -f "$GRAPHDB_URL/rest/repositories/$REPOSITORY_ID" > /dev/null; then
    echo "Repository '$REPOSITORY_ID' already exists, checking if data needs to be imported..."
    
    # Check if data already exists by querying for ESG entities
    QUERY_RESULT=$(curl -s -G "$GRAPHDB_URL/repositories/$REPOSITORY_ID" \
        --data-urlencode "query=SELECT (COUNT(*) as ?count) WHERE { ?s a <http://example.org/esg#Industry> }" \
        -H "Accept: application/sparql-results+json" \
        --user "$ADMIN_USER:$ADMIN_PASS" 2>/dev/null || echo '{"results":{"bindings":[{"count":{"value":"0"}}]}}')
    
    COUNT=$(echo "$QUERY_RESULT" | grep -o '"value":"[0-9]*"' | head -1 | grep -o '[0-9]*' || echo "0")
    
    if [ "$COUNT" -gt 0 ]; then
        echo "ESG data already imported (found $COUNT industries), skipping import."
        exit 0
    else
        echo "Repository exists but no ESG data found, proceeding with data import..."
    fi
else
    echo "Creating repository '$REPOSITORY_ID'..."

    # Create repository configuration with ESG-optimized settings
    REPO_CONFIG=$(cat <<EOF
{
    "id": "$REPOSITORY_ID",
    "title": "ESG Knowledge Graph Repository - Metrics & Reporting Platform",
    "type": "graphdb",
    "params": {
        "ruleset": {
            "label": "Ruleset",
            "name": "ruleset",
            "value": "rdfsplus-optimized"
        },
        "storageFolder": {
            "label": "Storage folder",
            "name": "storageFolder",
            "value": "storage"
        },
        "enableContextIndex": {
            "label": "Enable context index",
            "name": "enableContextIndex",
            "value": "true"
        },
        "enablePredicateList": {
            "label": "Enable predicate list index",
            "name": "enablePredicateList", 
            "value": "true"
        },
        "inMemoryLiteralProperties": {
            "label": "Cache literals",
            "name": "inMemoryLiteralProperties",
            "value": "true"
        },
        "enableLiteralIndex": {
            "label": "Enable literal index",
            "name": "enableLiteralIndex",
            "value": "true"
        },
        "shaclEnabled": {
            "label": "Enable SHACL validation",
            "name": "shaclEnabled",
            "value": "true"
        },
        "checkForInconsistencies": {
            "label": "Check for inconsistencies",
            "name": "checkForInconsistencies",
            "value": "true"
        },
        "disableSameAs": {
            "label": "Disable owl:sameAs",
            "name": "disableSameAs",
            "value": "false"
        }
    }
}
EOF
    )

    # Create the repository
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "$REPO_CONFIG" \
        "$GRAPHDB_URL/rest/repositories" \
        --user "$ADMIN_USER:$ADMIN_PASS"

    if [ $? -eq 0 ]; then
        echo "Repository '$REPOSITORY_ID' created successfully!"
    else
        echo "Failed to create repository '$REPOSITORY_ID'"
        exit 1
    fi

    # Wait a moment for repository to be fully initialized
    sleep 3
fi

# Import initial ESG knowledge graph data
echo "Importing initial ESG knowledge graph data..."

if [ -f "$INIT_DATA_FILE" ]; then
    echo "Found ESG data file: $INIT_DATA_FILE"
    
    # Import the TTL file using GraphDB REST API with proper error handling
    echo "Importing ESG knowledge graph into repository '$REPOSITORY_ID'..."
    
    # First, test repository with minimal triple
    echo "Testing repository connectivity..."
    test_status=$(curl -u "$ADMIN_USER:$ADMIN_PASS" -sS --write-out "%{http_code}" -o /dev/null \
        -H "Content-Type: application/sparql-update" \
        --data-binary 'INSERT DATA { <urn:test> <urn:pred> "connectivity-ok" . }' \
        "$GRAPHDB_URL/repositories/$REPOSITORY_ID/statements" || echo "000")
    
    if [ "$test_status" != "204" ] && [ "$test_status" != "200" ]; then
        echo "❌ Repository connectivity test failed (HTTP $test_status)"
        echo "This indicates a repository configuration problem."
        exit 1
    fi
    
    echo "✅ Repository connectivity OK"
    
    # Import the actual ESG data
    echo "Importing ESG knowledge graph..."
    status=$(curl -u "$ADMIN_USER:$ADMIN_PASS" \
        -sS --write-out "%{http_code}" -o /tmp/import.out \
        -H "Content-Type: text/turtle" \
        --data-binary "@$INIT_DATA_FILE" \
        "$GRAPHDB_URL/repositories/$REPOSITORY_ID/statements" || echo "000")
    
    if [ "$status" != "204" ] && [ "$status" != "200" ]; then
        echo "❌ Import failed (HTTP $status):"
        cat /tmp/import.out
        exit 1
    fi
    
    echo "✅ Import successful (HTTP $status)"
    
    # Verify import by counting triples
    sleep 2
    TRIPLE_COUNT=$(curl -s -G "$GRAPHDB_URL/repositories/$REPOSITORY_ID" \
        --data-urlencode "query=SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }" \
        -H "Accept: application/sparql-results+json" \
        --user "$ADMIN_USER:$ADMIN_PASS" 2>/dev/null | \
        grep -o '"value":"[0-9]*"' | head -1 | grep -o '[0-9]*' || echo "0")
    
    echo "Total triples imported: $TRIPLE_COUNT"
    
    # Count industries specifically  
    INDUSTRY_COUNT=$(curl -s -G "$GRAPHDB_URL/repositories/$REPOSITORY_ID" \
        --data-urlencode "query=SELECT (COUNT(*) as ?count) WHERE { ?s a <http://example.org/esg#Industry> }" \
        -H "Accept: application/sparql-results+json" \
        --user "$ADMIN_USER:$ADMIN_PASS" 2>/dev/null | \
        grep -o '"value":"[0-9]*"' | head -1 | grep -o '[0-9]*' || echo "0")
    
    echo "ESG Industries imported: $INDUSTRY_COUNT"
    
    if [ "$INDUSTRY_COUNT" -eq 0 ]; then
        echo "⚠️  Warning: No ESG industries found - check data file format"
    fi
else
    echo "Warning: ESG data file not found at $INIT_DATA_FILE"
    echo "Repository created but no initial data imported."
fi

echo "Repository initialization completed successfully!"

# Print access information
echo ""
echo "=== GraphDB ESG Repository Ready ==="
echo "Repository ID: $REPOSITORY_ID"
echo "GraphDB URL: $GRAPHDB_URL"
echo "SPARQL Endpoint: $GRAPHDB_URL/repositories/$REPOSITORY_ID"
echo "Workbench: $GRAPHDB_URL/workbench"
echo "Admin credentials: $ADMIN_USER/$ADMIN_PASS"
echo "SHACL validation: Enabled"
echo "======================================="
