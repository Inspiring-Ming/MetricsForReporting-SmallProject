import { config } from '../config';
import { GraphDBError, GraphDBQueryError, GraphDBWriteError } from '../types/errors';
import { Repository } from '../types';

/**
 * GraphDB 仓库类 - 负责与 GraphDB 的所有交互
 */
export class GraphDBRepository {
  private baseUrl: string;
  private repositoryName: string;

  constructor() {
    this.baseUrl = config.GRAPHDB_URL;
    this.repositoryName = config.GRAPHDB_REPO;
  }

  /**
   * 获取所有仓库列表
   */
  async listRepositories(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/repositories`, {
        headers: { Accept: 'application/sparql-results+json' },
      });

      if (!response.ok) {
        throw new GraphDBError(
          `Failed to fetch repositories: ${response.status} ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GraphDBError) {
        throw error;
      }
      throw new GraphDBError('Connection to GraphDB failed', { originalError: error });
    }
  }

  /**
   * 执行 SPARQL 查询
   */
  async executeSparqlQuery(query: string, infer?: boolean, sameAs?: boolean): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      if (infer !== undefined) params.set('infer', infer ? 'true' : 'false');
      if (sameAs !== undefined) params.set('sameAs', sameAs ? 'true' : 'false');

      const isSelect = /\bselect\b/i.test(query);
      const isAsk = /\bask\b/i.test(query);
      const isConstruct = /\b(construct|describe)\b/i.test(query);
      const isUpdate = /\b(insert|delete|load|clear|create|drop)\b/i.test(query);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      };

      let endpoint = '';
      
      if (isUpdate) {
        // UPDATE queries use /statements endpoint
        params.set('update', query);
        headers['Accept'] = '*/*';
        endpoint = 'statements';
      } else {
        // SELECT, ASK, CONSTRUCT, DESCRIBE use base repository endpoint
        params.set('query', query);
        if (isSelect || isAsk) {
          headers['Accept'] = 'application/sparql-results+json';
        } else if (isConstruct) {
          headers['Accept'] = 'text/turtle';
        } else {
          headers['Accept'] = 'application/sparql-results+json';
        }
      }

      const response = await fetch(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}${endpoint ? '/' + endpoint : ''}`,
        {
          method: 'POST',
          headers,
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBQueryError(
          `SPARQL query execution failed: ${response.status} ${response.statusText}`,
          { 
            query, 
            status: response.status, 
            statusText: response.statusText,
            errorDetails: errorText 
          }
        );
      }

      // Handle different query types
      if (isUpdate) {
        // UPDATE queries typically don't return data
        return { ok: true };
      } else if (isSelect || isAsk) {
        // SELECT and ASK return JSON
        return await response.json();
      } else if (isConstruct) {
        // CONSTRUCT returns turtle
        return await response.text();
      } else {
        // Default: try to parse as JSON
        return await response.json();
      }
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError('SPARQL query execution failed', { 
        query, 
        originalError: error 
      });
    }
  }

  /**
   * 写入 Turtle 数据
   */
  async writeTurtleData(ttl: string, graph?: string): Promise<{ ok: boolean }> {
    try {
      const url = new URL(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}/statements`
      );

      if (graph) {
        url.searchParams.set('context', `<${graph}>`);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/turtle; charset=utf-8' },
        body: ttl,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBWriteError(
          `Failed to write turtle data: ${response.status} ${response.statusText}`,
          {
            ttl,
            graph,
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorText
          }
        );
      }

      return { ok: true };
    } catch (error) {
      if (error instanceof GraphDBWriteError) {
        throw error;
      }
      throw new GraphDBWriteError('Failed to write turtle data', { 
        ttl, 
        graph, 
        originalError: error 
      });
    }
  }

  /**
   * 删除指定图中的所有数据
   */
  async deleteGraph(graph: string): Promise<{ ok: boolean }> {
    try {
      const url = new URL(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}/statements`
      );
      url.searchParams.set('context', `<${graph}>`);

      const response = await fetch(url.toString(), { method: 'DELETE' });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBWriteError(
          `Failed to delete graph: ${response.status} ${response.statusText}`,
          {
            graph,
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorText
          }
        );
      }

      return { ok: true };
    } catch (error) {
      if (error instanceof GraphDBWriteError) {
        throw error;
      }
      throw new GraphDBWriteError('Failed to delete graph', { 
        graph, 
        originalError: error 
      });
    }
  }

  /**
   * 上传 TTL 文件到 GraphDB
   */
  async uploadTTLFile(ttl: string, graph?: string, baseUri?: string): Promise<{ ok: boolean }> {
    try {
      const url = new URL(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}/statements`
      );

      if (graph) {
        url.searchParams.set('context', `<${graph}>`);
      }
      if (baseUri) {
        url.searchParams.set('baseURI', baseUri);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/turtle; charset=utf-8',
          'Accept': 'application/json'
        },
        body: ttl,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBWriteError(
          `TTL upload failed: ${response.status} ${response.statusText}`,
          {
            ttl,
            graph,
            baseUri,
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorText
          }
        );
      }

      return { ok: true };
    } catch (error) {
      if (error instanceof GraphDBWriteError) {
        throw error;
      }
      throw new GraphDBWriteError('TTL upload failed', { 
        ttl, 
        graph, 
        baseUri, 
        originalError: error 
      });
    }
  }

  /**
   * 执行 SHACL 验证
   */
  async validateWithShacl(shapesTtl: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/rest/repositories/${encodeURIComponent(this.repositoryName)}/validate/text`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/turtle', 
          'Accept': 'text/turtle' 
        },
        body: shapesTtl,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBQueryError(
          `SHACL validation failed: ${response.status} ${response.statusText}`,
          {
            shapesTtl,
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorText
          }
        );
      }

      const result = await response.text();
      return result || '# Empty validation report';
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError('SHACL validation failed', { 
        shapesTtl, 
        originalError: error 
      });
    }
  }

  /**
   * 清空 repository 中的所有数据
   */
  async clearAllData(): Promise<{ ok: boolean; message: string }> {
    try {
      const sparqlUpdate = `DELETE WHERE { ?s ?p ?o }`;
      
      const response = await fetch(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}/statements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sparql-update',
          },
          body: sparqlUpdate,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new GraphDBWriteError(
          `Failed to clear all data: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorText
          }
        );
      }

      return { 
        ok: true, 
        message: 'All data cleared successfully' 
      };
    } catch (error) {
      if (error instanceof GraphDBWriteError) {
        throw error;
      }
      throw new GraphDBWriteError('Failed to clear all data', { 
        originalError: error 
      });
    }
  }

  /**
   * 获取 repository 中的三元组数量
   */
  async countTriples(): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repositories/${encodeURIComponent(this.repositoryName)}/size`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
          },
        }
      );

      if (!response.ok) {
        throw new GraphDBQueryError(
          `Failed to count triples: ${response.status} ${response.statusText}`,
          { status: response.status }
        );
      }

      const count = await response.text();
      return parseInt(count.trim(), 10);
    } catch (error) {
      if (error instanceof GraphDBQueryError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to count triples', { 
        originalError: error 
      });
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ ok: boolean; repo: string; graphdb: string }> {
    try {
      await this.listRepositories();
      return {
        ok: true,
        repo: this.repositoryName,
        graphdb: this.baseUrl
      };
    } catch (error) {
      throw new GraphDBError('GraphDB health check failed', { originalError: error });
    }
  }
}