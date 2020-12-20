import * as ts from 'typescript';
import {
  GetTsAutoMockCacheOptions,
  TsAutoMockCacheOptions,
} from '../../options/cache';
import { GetDescriptor } from '../descriptor/descriptor';
import { GetProperties } from '../descriptor/properties/properties';
import { GetTypeofEnumDescriptor } from '../descriptor/typeQuery/enumTypeQuery';
import { TypescriptCreator } from '../helper/creator';
import {
  MockIdentifierGenericParameter,
  MockIdentifierGenericParameterValue,
} from '../mockIdentifier/mockIdentifier';
import { PrivateIdentifier } from '../privateIdentifier/privateIdentifier';
import { Scope } from '../scope/scope';
import { DeclarationCache } from './cache/declarationCache';
import { DeclarationListCache } from './cache/declarationListCache';
import { FactoryUniqueName, PossibleDeclaration } from './factoryUniqueName';
import { ModuleName } from './modules/moduleName';
import { ModuleImportIdentifierPerFile } from './modules/moduleImportIdentifierPerFile';

interface FactoryRegistrationPerFile {
  [key: string]: Array<{
    key: ts.Declaration;
    factory: ts.Expression;
  }>;
}

interface FactoryIntersectionRegistrationPerFile {
  [key: string]: Array<{
    keys: ts.Declaration[];
    factory: ts.Expression;
  }>;
}

export class MockDefiner {
  private _moduleImportIdentifierPerFile: ModuleImportIdentifierPerFile;
  private _factoryRegistrationsPerFile: FactoryRegistrationPerFile = {};
  private _hydratedFactoryRegistrationsPerFile: FactoryRegistrationPerFile = {};
  private _factoryIntersectionsRegistrationsPerFile: FactoryIntersectionRegistrationPerFile = {};
  private _factoryCache: DeclarationCache;
  private _hydratedFactoryCache: DeclarationCache;
  private _registerMockFactoryCache: DeclarationCache;
  private _declarationCache: DeclarationCache;
  private _hydratedDeclarationCache: DeclarationCache;
  private _factoryIntersectionCache: DeclarationListCache;
  private _fileName: string;
  private _factoryUniqueName: FactoryUniqueName;
  private readonly _cacheEnabled: TsAutoMockCacheOptions;

  private constructor() {
    this._factoryCache = new DeclarationCache();
    this._declarationCache = new DeclarationCache();
    this._hydratedDeclarationCache = new DeclarationCache();
    this._hydratedFactoryCache = new DeclarationCache();
    this._factoryIntersectionCache = new DeclarationListCache();
    this._factoryUniqueName = new FactoryUniqueName();
    this._registerMockFactoryCache = new DeclarationCache();
    this._moduleImportIdentifierPerFile = new ModuleImportIdentifierPerFile();
    this._cacheEnabled = GetTsAutoMockCacheOptions();
  }

  private static _instance: MockDefiner;

  public static get instance(): MockDefiner {
    this._instance = this._instance || new MockDefiner();
    return this._instance;
  }

  public setFileNameFromNode(node: ts.Node): void {
    const thisFile: ts.SourceFile = node.getSourceFile();
    this._fileName = thisFile.fileName;
  }

  public setTsAutoMockImportIdentifier(): void {
    if (this._moduleImportIdentifierPerFile.has(this._fileName)) {
      return;
    }

    this._moduleImportIdentifierPerFile.set(this._fileName);
  }

  public getCurrentModuleIdentifier(module: ModuleName): ts.Identifier {
    return this._getModuleIdentifier(this._fileName, module);
  }

  public getTopStatementsForFile(sourceFile: ts.SourceFile): ts.Statement[] {
    return [
      ...this._getImportsToAddInFile(sourceFile),
      ...this._getExportsToAddInFile(sourceFile),
      ...this._getHydratedExportsToAddInFile(sourceFile),
      ...this._getExportsIntersectionToAddInFile(sourceFile),
    ];
  }

  public initFile(sourceFile: ts.SourceFile): void {
    if (!this._cacheEnabled) {
      this._factoryCache = new DeclarationCache();
      this._hydratedFactoryCache = new DeclarationCache();
      this._declarationCache = new DeclarationCache();
      this._hydratedDeclarationCache = new DeclarationCache();
      this._factoryIntersectionCache = new DeclarationListCache();
    }
    this._factoryRegistrationsPerFile[sourceFile.fileName] = [];
    this._hydratedFactoryRegistrationsPerFile[sourceFile.fileName] = [];
    this._factoryIntersectionsRegistrationsPerFile[sourceFile.fileName] = [];
  }

  public createMockFactory(declaration: ts.Declaration, scope: Scope): void {
    const thisFileName: string = this._fileName;

    if (scope.hydrated) {
      const key: string = this.getHydratedDeclarationKeyMap(declaration);
      this._hydratedFactoryCache.set(declaration, key);
      this._hydratedFactoryRegistrationsPerFile[thisFileName] =
        this._hydratedFactoryRegistrationsPerFile[thisFileName] || [];

      const newScope: Scope = new Scope(key);
      newScope.hydrated = scope.hydrated;

      const descriptor: ts.Expression = GetDescriptor(declaration, newScope);

      const mockGenericParameter: ts.ParameterDeclaration = this._getMockGenericParameter();

      const factory: ts.FunctionExpression = TypescriptCreator.createFunctionExpressionReturn(
        descriptor,
        [mockGenericParameter]
      );
      this._hydratedFactoryRegistrationsPerFile[thisFileName].push({
        key: declaration,
        factory,
      });
    } else {
      const key: string = this.getDeclarationKeyMap(declaration);
      this._factoryCache.set(declaration, key);
      this._factoryRegistrationsPerFile[thisFileName] =
        this._factoryRegistrationsPerFile[thisFileName] || [];

      const newScope: Scope = new Scope(key);
      newScope.hydrated = scope.hydrated;

      const descriptor: ts.Expression = GetDescriptor(declaration, newScope);

      const mockGenericParameter: ts.ParameterDeclaration = this._getMockGenericParameter();

      const factory: ts.FunctionExpression = TypescriptCreator.createFunctionExpressionReturn(
        descriptor,
        [mockGenericParameter]
      );

      this._factoryRegistrationsPerFile[thisFileName].push({
        key: declaration,
        factory,
      });
    }
  }

  public getMockFactoryTypeofEnum(
    declaration: ts.EnumDeclaration
  ): ts.Expression {
    const key: string = this._getMockFactoryIdForTypeofEnum(declaration);

    return this.getMockFactoryByKey(key);
  }

  public getMockFactoryIntersection(
    declarations: ts.Declaration[],
    type: ts.IntersectionTypeNode
  ): ts.Expression {
    const key: string = this._getMockFactoryIdForIntersections(
      declarations,
      type
    );

    return this.getMockFactoryByKey(key);
  }

  public getMockFactoryByKey(key: string): ts.Expression {
    this.setTsAutoMockImportIdentifier();

    return this._getCallGetFactory(key);
  }

  public getDeclarationKeyMap(declaration: ts.Declaration): string {
    if (!this._declarationCache.has(declaration)) {
      this._declarationCache.set(
        declaration,
        this._factoryUniqueName.createForDeclaration(
          declaration as PossibleDeclaration
        )
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._declarationCache.get(declaration)!;
  }

  public getHydratedDeclarationKeyMap(declaration: ts.Declaration): string {
    if (!this._hydratedDeclarationCache.has(declaration)) {
      this._hydratedDeclarationCache.set(
        declaration,
        this._factoryUniqueName.createForDeclaration(
          declaration as PossibleDeclaration
        )
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._hydratedDeclarationCache.get(declaration)!;
  }

  public registerMockFor(
    declaration: ts.Declaration,
    factory: ts.FunctionExpression
  ): ts.Node {
    const key: string = this.getDeclarationKeyMap(declaration);

    this._registerMockFactoryCache.set(declaration, key);

    return this._getCallRegisterMock(
      this._fileName,
      key,
      this._wrapRegisterMockFactory(factory)
    );
  }

  public hasMockForDeclaration(
    declaration: ts.Declaration,
    scope: Scope
  ): boolean {
    if (scope.hydrated) {
      return this._hydratedFactoryCache.has(declaration);
    }

    return (
      this._factoryCache.has(declaration) ||
      this._registerMockFactoryCache.has(declaration)
    );
  }

  private _mockRepositoryAccess(filename: string): ts.Expression {
    const repository: ts.Identifier = this._getModuleIdentifier(
      filename,
      ModuleName.Repository
    );

    return ts.createPropertyAccess(
      ts.createPropertyAccess(repository, PrivateIdentifier('Repository')),
      ts.createIdentifier('instance')
    );
  }

  private _getModuleIdentifier(
    fileName: string,
    module: ModuleName
  ): ts.Identifier {
    return this._moduleImportIdentifierPerFile.getModule(fileName, module);
  }
  private _getMockFactoryIdForTypeofEnum(
    declaration: ts.EnumDeclaration
  ): string {
    const thisFileName: string = this._fileName;

    const cachedFactory: string | undefined = this._factoryCache.get(
      declaration
    );
    if (cachedFactory) {
      return cachedFactory;
    }

    const key: string = this.getDeclarationKeyMap(declaration);

    this._factoryCache.set(declaration, key);

    this._factoryRegistrationsPerFile[thisFileName] =
      this._factoryRegistrationsPerFile[thisFileName] || [];

    const factory: ts.Expression = GetTypeofEnumDescriptor(declaration);

    this._factoryRegistrationsPerFile[thisFileName].push({
      key: declaration,
      factory,
    });

    return key;
  }

  private _getMockFactoryIdForIntersections(
    declarations: ts.Declaration[],
    intersectionTypeNode: ts.IntersectionTypeNode
  ): string {
    const thisFileName: string = this._fileName;

    if (this._factoryIntersectionCache.has(declarations)) {
      // eslint-disable-next-line
      return this._factoryIntersectionCache.get(declarations)!;
    }

    const key: string = this._factoryUniqueName.createForIntersection(
      declarations
    );

    this._factoryIntersectionCache.set(declarations, key);

    this._factoryIntersectionsRegistrationsPerFile[thisFileName] =
      this._factoryIntersectionsRegistrationsPerFile[thisFileName] || [];

    const descriptor: ts.Expression = GetProperties(
      intersectionTypeNode,
      new Scope(key)
    );

    const mockGenericParameter: ts.ParameterDeclaration = this._getMockGenericParameter();

    const factory: ts.FunctionExpression = TypescriptCreator.createFunctionExpressionReturn(
      descriptor,
      [mockGenericParameter]
    );

    this._factoryIntersectionsRegistrationsPerFile[thisFileName].push({
      keys: declarations,
      factory,
    });

    return key;
  }

  private _getImportsToAddInFile(sourceFile: ts.SourceFile): ts.Statement[] {
    if (this._moduleImportIdentifierPerFile.has(sourceFile.fileName)) {
      return this._moduleImportIdentifierPerFile.get(sourceFile.fileName);
    }

    return [];
  }

  private _getExportsToAddInFile(sourceFile: ts.SourceFile): ts.Statement[] {
    if (this._factoryRegistrationsPerFile[sourceFile.fileName]) {
      return this._factoryRegistrationsPerFile[sourceFile.fileName].map(
        (reg: { key: ts.Declaration; factory: ts.Expression }) => {
          // NOTE: this._factoryRegistrationsPerFile and this._factoryCache are
          // populated in the same routine and if the former is defined the
          // latter will be too!
          // eslint-disable-next-line
          const key: string = this._factoryCache.get(reg.key)!;

          return this._createRegistration(
            sourceFile.fileName,
            key,
            reg.factory
          );
        }
      );
    }

    return [];
  }

  private _getHydratedExportsToAddInFile(
    sourceFile: ts.SourceFile
  ): ts.Statement[] {
    if (this._hydratedFactoryRegistrationsPerFile[sourceFile.fileName]) {
      return this._hydratedFactoryRegistrationsPerFile[sourceFile.fileName].map(
        (reg: { key: ts.Declaration; factory: ts.Expression }) => {
          // NOTE: this._hydratedFactoryRegistrationsPerFile and this._hydratedFactoryCache are
          // populated in the same routine and if the former is defined the
          // latter will be too!
          // eslint-disable-next-line
          const key: string = this._hydratedFactoryCache.get(reg.key)!;

          return this._createRegistration(
            sourceFile.fileName,
            key,
            reg.factory
          );
        }
      );
    }

    return [];
  }

  private _getExportsIntersectionToAddInFile(
    sourceFile: ts.SourceFile
  ): ts.Statement[] {
    if (this._factoryIntersectionsRegistrationsPerFile[sourceFile.fileName]) {
      return this._factoryIntersectionsRegistrationsPerFile[
        sourceFile.fileName
      ].map((reg: { keys: ts.Declaration[]; factory: ts.Expression }) => {
        // NOTE: this._factoryIntersectionsRegistrationsPerFile and
        // this._factoryIntersectionCache are populated in the same routine
        // and if the former is defined the latter will be too!
        // eslint-disable-next-line
        const key: string = this._factoryIntersectionCache.get(reg.keys)!;

        return this._createRegistration(sourceFile.fileName, key, reg.factory);
      });
    }

    return [];
  }

  private _createRegistration(
    fileName: string,
    key: string,
    factory: ts.Expression
  ): ts.Statement {
    return ts.createExpressionStatement(
      this._getCallRegisterMock(fileName, key, factory)
    );
  }

  private _wrapRegisterMockFactory(factory: ts.Expression): ts.Expression {
    return TypescriptCreator.createArrowFunction(
      TypescriptCreator.createCall(factory, [
        ts.createSpread(
          TypescriptCreator.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier('generics'),
              ts.createIdentifier('map')
            ),
            [
              TypescriptCreator.createArrowFunction(
                TypescriptCreator.createCall(
                  ts.createPropertyAccess(
                    ts.createIdentifier('g'),
                    MockIdentifierGenericParameterValue
                  ),
                  []
                ),
                [TypescriptCreator.createParameter('g')]
              ),
            ]
          )
        ),
      ]),
      [TypescriptCreator.createParameter('generics')]
    );
  }

  private _getCallRegisterMock(
    fileName: string,
    key: string,
    factory: ts.Expression
  ): ts.CallExpression {
    return ts.createCall(
      ts.createPropertyAccess(
        this._mockRepositoryAccess(fileName),
        ts.createIdentifier('registerFactory')
      ),
      [],
      [ts.createStringLiteral(key), factory]
    );
  }

  private _getCallGetFactory(key: string): ts.CallExpression {
    return ts.createCall(
      ts.createPropertyAccess(
        this._mockRepositoryAccess(this._fileName),
        ts.createIdentifier('getFactory')
      ),
      [],
      [ts.createStringLiteral(key)]
    );
  }

  private _getMockGenericParameter(): ts.ParameterDeclaration {
    return ts.createParameter(
      [],
      [],
      undefined,
      MockIdentifierGenericParameter
    );
  }
}
