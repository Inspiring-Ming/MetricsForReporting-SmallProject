import { GraphDBRepository } from './graphDBRepository';
import {
  ImplementationDTO,
  GetImplementationsRequest,
  CreateImplementationRequest,
  UpdateImplementationRequest
} from '../types/kg';
import { GraphDBQueryError, NotFoundError, ValidationError, DeleteConflictError } from '../types/errors';

/**
 * Implementation Repository - 专门处理实现相关的 SPARQL 查询和数据操作
 */
export class ImplementationRepository {
  private graphDB: GraphDBRepository;
  private readonly prefix = `
    PREFIX esg: <http://example.org/esg#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  `;

  constructor(graphDB?: GraphDBRepository) {
    this.graphDB = graphDB || new GraphDBRepository();
  }

  /**
   * 获取实现列表（支持分页和搜索）
   */
  async getImplementations(params: GetImplementationsRequest): Promise<{ implementations: ImplementationDTO[], total: number }> {
    const { page = 1, size = 10, search, language, filePath, calculationType, sort = 'label', order = 'asc' } = params;
    const offset = (page - 1) * size;

    // 构建过滤条件
    const filters: string[] = [];

    if (search) {
      filters.push(`FILTER(CONTAINS(LCASE(?label), LCASE("${this.escapeSparql(search)}")))`);
    }

    if (language) {
      filters.push(`FILTER(?language = "${this.escapeSparql(language)}")`);
    }

    if (filePath) {
      filters.push(`FILTER(CONTAINS(?filePath, "${this.escapeSparql(filePath)}"))`);
    }

    // 如果按计算类型筛选，需要通过模型反向查询
    const calculationTypeJoin = calculationType
      ? `?model a esg:Model ;
           esg:hasCalculationType "${this.escapeSparql(calculationType)}" ;
           esg:executesWith ?implementation .`
      : '';

    const filterClause = filters.join('\n        ');

    // 构建排序条件
    const orderClause = order === 'desc' ? 'DESC' : '';
    const sortVar = sort === 'createdAt' ? '?createdAt' : '?label';

    const query = `
      ${this.prefix}
      
      SELECT DISTINCT ?implementation ?label ?language ?filePath ?functionName ?returnType ?validation
      WHERE {
        ?implementation a esg:Implementation ;
                       rdfs:label ?label .
        OPTIONAL { ?implementation esg:hasLanguage ?language . }
        OPTIONAL { ?implementation esg:hasFilePath ?filePath . }
        OPTIONAL { ?implementation esg:hasFunction ?functionName . }
        OPTIONAL { ?implementation esg:hasReturnType ?returnType . }
        OPTIONAL { ?implementation esg:hasValidation ?validation . }
        ${calculationTypeJoin}
        ${filterClause}
      }
      ORDER BY ${orderClause}(${sortVar})
      LIMIT ${size}
      OFFSET ${offset}
    `;

    // 获取总数
    const countQuery = `
      ${this.prefix}
      
      SELECT (COUNT(DISTINCT ?implementation) AS ?count)
      WHERE {
        ?implementation a esg:Implementation ;
                       rdfs:label ?label .
        OPTIONAL { ?implementation esg:hasLanguage ?language . }
        OPTIONAL { ?implementation esg:hasFilePath ?filePath . }
        ${calculationTypeJoin}
        ${filterClause}
      }
    `;

    try {
      const [resultData, countData] = await Promise.all([
        this.graphDB.executeSparqlQuery(query),
        this.graphDB.executeSparqlQuery(countQuery)
      ]);

      const implementations: ImplementationDTO[] = resultData.results.bindings.map((binding: any) => ({
        iri: binding.implementation.value,
        label: binding.label.value,
        language: binding.language?.value,
        filePath: binding.filePath?.value,
        functionName: binding.functionName?.value,
        returnType: binding.returnType?.value,
        validation: binding.validation?.value
      }));

      const total = parseInt(countData.results.bindings[0]?.count?.value || '0', 10);

      return { implementations, total };
    } catch (error) {
      throw new GraphDBQueryError('Failed to fetch implementations', { originalError: error });
    }
  }

  /**
   * 根据 ID 获取实现详情
   */
  async getImplementationById(id: string): Promise<ImplementationDTO & {
    description?: string,
    inputParameters?: string,
    relatedModels?: Array<{ iri: string, label: string, calculationType?: string }>
  }> {
    const implementationUri = this.resolveImplementationUri(id);

    const query = `
      ${this.prefix}
      
      SELECT ?label ?language ?filePath ?functionName ?returnType ?validation ?description ?inputParameters
             ?model ?modelLabel ?calculationType
      WHERE {
        <${implementationUri}> a esg:Implementation ;
                              rdfs:label ?label .
        OPTIONAL { <${implementationUri}> esg:hasLanguage ?language . }
        OPTIONAL { <${implementationUri}> esg:hasFilePath ?filePath . }
        OPTIONAL { <${implementationUri}> esg:hasFunction ?functionName . }
        OPTIONAL { <${implementationUri}> esg:hasReturnType ?returnType . }
        OPTIONAL { <${implementationUri}> esg:hasValidation ?validation . }
        OPTIONAL { <${implementationUri}> esg:hasDescription ?description . }
        OPTIONAL { <${implementationUri}> esg:hasInputParameters ?inputParameters . }
        
        # 获取使用此实现的模型
        OPTIONAL {
          ?model esg:executesWith <${implementationUri}> ;
                 rdfs:label ?modelLabel .
          OPTIONAL { ?model esg:hasCalculationType ?calculationType . }
        }
      }
    `;

    try {
      const data = await this.graphDB.executeSparqlQuery(query);

      if (data.results.bindings.length === 0) {
        throw new NotFoundError(`Implementation not found: ${id}`);
      }

      const firstBinding = data.results.bindings[0];

      // 收集所有关联的模型
      const relatedModels: Array<{ iri: string, label: string, calculationType?: string }> = [];
      const seenModels = new Set<string>();

      for (const binding of data.results.bindings) {
        if (binding.model && !seenModels.has(binding.model.value)) {
          seenModels.add(binding.model.value);
          relatedModels.push({
            iri: binding.model.value,
            label: binding.modelLabel?.value || '',
            calculationType: binding.calculationType?.value
          });
        }
      }

      return {
        iri: implementationUri,
        label: firstBinding.label.value,
        language: firstBinding.language?.value,
        filePath: firstBinding.filePath?.value,
        functionName: firstBinding.functionName?.value,
        returnType: firstBinding.returnType?.value,
        validation: firstBinding.validation?.value,
        description: firstBinding.description?.value,
        inputParameters: firstBinding.inputParameters?.value,
        relatedModels: relatedModels.length > 0 ? relatedModels : undefined
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new GraphDBQueryError(`Failed to fetch implementation: ${id}`, { originalError: error });
    }
  }

  /**
   * 创建新实现
   */
  async createImplementation(data: CreateImplementationRequest): Promise<string> {
    this.validateImplementationData(data);

    const implementationUri = `http://example.org/esg#Implementation_${data.name}`;

    // 检查是否已存在
    const existsQuery = `
      ${this.prefix}
      ASK { <${implementationUri}> a esg:Implementation . }
    `;

    try {
      const existsResult = await this.graphDB.executeSparqlQuery(existsQuery);
      if (existsResult.boolean) {
        throw new ValidationError(`Implementation with name "${data.name}" already exists`);
      }

      // 构建插入语句
      const triples: string[] = [
        `<${implementationUri}> a esg:Implementation .`,
        `<${implementationUri}> rdfs:label "${this.escapeSparql(data.name)}" .`,
        `<${implementationUri}> esg:hasLanguage "${this.escapeSparql(data.language)}" .`,
        `<${implementationUri}> esg:hasFilePath "${this.escapeSparql(data.file_path)}" .`
      ];

      if (data.function_name) {
        triples.push(`<${implementationUri}> esg:hasFunction "${this.escapeSparql(data.function_name)}" .`);
      }
      if (data.description) {
        triples.push(`<${implementationUri}> esg:hasDescription "${this.escapeSparql(data.description)}" .`);
      }
      if (data.input_parameters) {
        triples.push(`<${implementationUri}> esg:hasInputParameters "${this.escapeSparql(data.input_parameters)}" .`);
      }
      if (data.return_type) {
        triples.push(`<${implementationUri}> esg:hasReturnType "${this.escapeSparql(data.return_type)}" .`);
      }
      if (data.validation) {
        triples.push(`<${implementationUri}> esg:hasValidation "${this.escapeSparql(data.validation)}" .`);
      }

      const insertQuery = `
        ${this.prefix}
        INSERT DATA {
          ${triples.join('\n          ')}
        }
      `;

      await this.graphDB.executeSparqlQuery(insertQuery);
      return implementationUri;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new GraphDBQueryError('Failed to create implementation', { originalError: error });
    }
  }

  /**
   * 更新实现
   */
  async updateImplementation(id: string, data: UpdateImplementationRequest): Promise<void> {
    const implementationUri = this.resolveImplementationUri(id);

    // 验证实现是否存在
    await this.getImplementationById(id);

    const updates: string[] = [];
    const deletes: string[] = [];

    if (data.label !== undefined) {
      deletes.push(`<${implementationUri}> rdfs:label ?oldLabel .`);
      updates.push(`<${implementationUri}> rdfs:label "${this.escapeSparql(data.label)}" .`);
    }
    if (data.language !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasLanguage ?oldLanguage .`);
      updates.push(`<${implementationUri}> esg:hasLanguage "${this.escapeSparql(data.language)}" .`);
    }
    if (data.file_path !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasFilePath ?oldFilePath .`);
      updates.push(`<${implementationUri}> esg:hasFilePath "${this.escapeSparql(data.file_path)}" .`);
    }
    if (data.function_name !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasFunction ?oldFunction .`);
      updates.push(`<${implementationUri}> esg:hasFunction "${this.escapeSparql(data.function_name)}" .`);
    }
    if (data.description !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasDescription ?oldDescription .`);
      updates.push(`<${implementationUri}> esg:hasDescription "${this.escapeSparql(data.description)}" .`);
    }
    if (data.input_parameters !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasInputParameters ?oldInputParameters .`);
      updates.push(`<${implementationUri}> esg:hasInputParameters "${this.escapeSparql(data.input_parameters)}" .`);
    }
    if (data.return_type !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasReturnType ?oldReturnType .`);
      updates.push(`<${implementationUri}> esg:hasReturnType "${this.escapeSparql(data.return_type)}" .`);
    }
    if (data.validation !== undefined) {
      deletes.push(`<${implementationUri}> esg:hasValidation ?oldValidation .`);
      updates.push(`<${implementationUri}> esg:hasValidation "${this.escapeSparql(data.validation)}" .`);
    }

    if (updates.length === 0) {
      return; // 没有更新
    }

    const updateQuery = `
      ${this.prefix}
      DELETE {
        ${deletes.join('\n        ')}
      }
      INSERT {
        ${updates.join('\n        ')}
      }
      WHERE {
        <${implementationUri}> a esg:Implementation .
        ${deletes.map(d => `OPTIONAL { ${d} }`).join('\n        ')}
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(updateQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to update implementation: ${id}`, { originalError: error });
    }
  }

  /**
   * 删除实现
   */
  async deleteImplementation(id: string, force: boolean = false): Promise<void> {
    const implementationUri = this.resolveImplementationUri(id);

    // 验证实现是否存在
    await this.getImplementationById(id);

    // 检查是否有模型引用
    if (!force) {
      const checkQuery = `
        ${this.prefix}
        ASK {
          ?model esg:executesWith <${implementationUri}> .
        }
      `;

      try {
        const checkResult = await this.graphDB.executeSparqlQuery(checkQuery);
        if (checkResult.boolean) {
          throw new DeleteConflictError(
            `Implementation "${id}" is referenced by one or more models. Use force=true to delete anyway.`,
            { implementationUri }
          );
        }
      } catch (error) {
        if (error instanceof DeleteConflictError) {
          throw error;
        }
        throw new GraphDBQueryError('Failed to check implementation references', { originalError: error });
      }
    }

    // 删除实现及其所有引用
    const deleteQuery = `
      ${this.prefix}
      DELETE {
        <${implementationUri}> ?p ?o .
        ?model esg:executesWith <${implementationUri}> .
      }
      WHERE {
        <${implementationUri}> a esg:Implementation ;
                              ?p ?o .
        OPTIONAL { ?model esg:executesWith <${implementationUri}> . }
      }
    `;

    try {
      await this.graphDB.executeSparqlQuery(deleteQuery);
    } catch (error) {
      throw new GraphDBQueryError(`Failed to delete implementation: ${id}`, { originalError: error });
    }
  }

  /**
   * 解析实现 URI（支持多种格式）
   */
  private resolveImplementationUri(id: string): string {
    // 如果已经是完整 URI
    if (id.startsWith('http://') || id.startsWith('https://')) {
      return id;
    }

    // 如果是命名空间格式 (esg:Implementation_Name)
    if (id.startsWith('esg:')) {
      return id.replace('esg:', 'http://example.org/esg#');
    }

    // 否则假设是简短 ID，构建标准 URI
    return `http://example.org/esg#Implementation_${id}`;
  }

  /**
   * 验证实现数据
   */
  private validateImplementationData(data: CreateImplementationRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Implementation name is required');
    }
    if (!data.language || data.language.trim().length === 0) {
      throw new ValidationError('Programming language is required');
    }
    if (!data.file_path || data.file_path.trim().length === 0) {
      throw new ValidationError('File path is required');
    }
  }

  /**
   * 转义 SPARQL 字符串中的特殊字符
   */
  private escapeSparql(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}
