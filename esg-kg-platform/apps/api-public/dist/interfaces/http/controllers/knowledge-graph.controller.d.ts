import { Request, Response, NextFunction } from 'express';
import { KnowledgeGraphQueryPort } from '../../../application/ports/inbound';
export declare class KnowledgeGraphController {
    private readonly knowledgeGraphService;
    constructor(knowledgeGraphService: KnowledgeGraphQueryPort);
    executeSparqlQuery(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchEntities(req: Request, res: Response, next: NextFunction): Promise<void>;
    getGraphMetadata(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getEntityByUri(req: Request, res: Response, next: NextFunction): Promise<void>;
    private buildEntitySearchQuery;
    private buildEntityDetailsQuery;
}
//# sourceMappingURL=knowledge-graph.controller.d.ts.map