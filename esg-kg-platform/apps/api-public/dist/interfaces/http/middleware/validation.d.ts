export declare const commonValidation: {
    framework: import("express-validator").ValidationChain;
    industry: import("express-validator").ValidationChain;
    entityId: import("express-validator").ValidationChain;
    code: import("express-validator").ValidationChain;
    value: import("express-validator").ValidationChain;
    unitIri: import("express-validator").ValidationChain;
    asOf: import("express-validator").ValidationChain;
    source: import("express-validator").ValidationChain;
    idempotencyKey: import("express-validator").ValidationChain;
};
export declare const metricValidation: {
    create: import("express-validator").ValidationChain[];
    update: import("express-validator").ValidationChain[];
    batch: import("express-validator").ValidationChain[];
    query: import("express-validator").ValidationChain[];
    id: import("express-validator").ValidationChain[];
};
export declare const computationValidation: {
    execute: import("express-validator").ValidationChain[];
    discoverMethods: import("express-validator").ValidationChain[];
    methodsQuery: import("express-validator").ValidationChain[];
    methodCode: import("express-validator").ValidationChain[];
};
export declare const knowledgeGraphValidation: {
    sparqlQuery: import("express-validator").ValidationChain[];
    entitySearch: import("express-validator").ValidationChain[];
    entityUri: import("express-validator").ValidationChain[];
};
//# sourceMappingURL=validation.d.ts.map