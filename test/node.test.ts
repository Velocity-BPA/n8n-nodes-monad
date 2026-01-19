/**
 * Tests for Monad Node structure
 * 
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Monad Node Structure', () => {
	const nodesDir = path.join(__dirname, '../nodes/Monad');
	
	describe('Required Files', () => {
		it('should have main node file', () => {
			expect(fs.existsSync(path.join(nodesDir, 'Monad.node.ts'))).toBe(true);
		});

		it('should have trigger node file', () => {
			expect(fs.existsSync(path.join(nodesDir, 'MonadTrigger.node.ts'))).toBe(true);
		});

		it('should have icon file', () => {
			expect(fs.existsSync(path.join(nodesDir, 'monad.svg'))).toBe(true);
		});

		it('should have actions directory', () => {
			expect(fs.existsSync(path.join(nodesDir, 'actions'))).toBe(true);
		});

		it('should have constants directory', () => {
			expect(fs.existsSync(path.join(nodesDir, 'constants'))).toBe(true);
		});

		it('should have transport directory', () => {
			expect(fs.existsSync(path.join(nodesDir, 'transport'))).toBe(true);
		});

		it('should have utils directory', () => {
			expect(fs.existsSync(path.join(nodesDir, 'utils'))).toBe(true);
		});
	});

	describe('Action Resources', () => {
		const actionsDir = path.join(nodesDir, 'actions');
		const expectedResources = [
			'account',
			'transaction',
			'token',
			'nft',
			'contract',
			'block',
			'event',
			'parallelExecution',
			'monadDb',
			'consensus',
			'gas',
			'staking',
			'governance',
			'defi',
			'multicall',
			'accountAbstraction',
			'mempool',
			'debugging',
			'performance',
			'analytics',
			'subgraph',
			'utility',
		];

		it('should have all 22 resource directories', () => {
			const resourceDirs = fs.readdirSync(actionsDir).filter(f => {
				const stat = fs.statSync(path.join(actionsDir, f));
				return stat.isDirectory();
			});
			expect(resourceDirs.length).toBe(22);
		});

		expectedResources.forEach(resource => {
			it(`should have ${resource} resource`, () => {
				const resourcePath = path.join(actionsDir, resource);
				expect(fs.existsSync(resourcePath)).toBe(true);
				expect(fs.existsSync(path.join(resourcePath, 'index.ts'))).toBe(true);
			});
		});

		it('should have actions index file', () => {
			expect(fs.existsSync(path.join(actionsDir, 'index.ts'))).toBe(true);
		});
	});

	describe('Constants', () => {
		const constantsDir = path.join(nodesDir, 'constants');

		it('should have networks constant', () => {
			expect(fs.existsSync(path.join(constantsDir, 'networks.ts'))).toBe(true);
		});

		it('should have contracts constant', () => {
			expect(fs.existsSync(path.join(constantsDir, 'contracts.ts'))).toBe(true);
		});

		it('should have tokens constant', () => {
			expect(fs.existsSync(path.join(constantsDir, 'tokens.ts'))).toBe(true);
		});

		it('should have validators constant', () => {
			expect(fs.existsSync(path.join(constantsDir, 'validators.ts'))).toBe(true);
		});

		it('should have performance constant', () => {
			expect(fs.existsSync(path.join(constantsDir, 'performance.ts'))).toBe(true);
		});
	});

	describe('Transport Clients', () => {
		const transportDir = path.join(nodesDir, 'transport');

		it('should have monad client', () => {
			expect(fs.existsSync(path.join(transportDir, 'monadClient.ts'))).toBe(true);
		});

		it('should have consensus client', () => {
			expect(fs.existsSync(path.join(transportDir, 'consensusClient.ts'))).toBe(true);
		});

		it('should have state client', () => {
			expect(fs.existsSync(path.join(transportDir, 'stateClient.ts'))).toBe(true);
		});

		it('should have high speed subscriber', () => {
			expect(fs.existsSync(path.join(transportDir, 'highSpeedSubscriber.ts'))).toBe(true);
		});

		it('should have mempool client', () => {
			expect(fs.existsSync(path.join(transportDir, 'mempoolClient.ts'))).toBe(true);
		});
	});

	describe('Utility Functions', () => {
		const utilsDir = path.join(nodesDir, 'utils');

		it('should have address utils', () => {
			expect(fs.existsSync(path.join(utilsDir, 'addressUtils.ts'))).toBe(true);
		});

		it('should have gas utils', () => {
			expect(fs.existsSync(path.join(utilsDir, 'gasUtils.ts'))).toBe(true);
		});

		it('should have parallel utils', () => {
			expect(fs.existsSync(path.join(utilsDir, 'parallelUtils.ts'))).toBe(true);
		});

		it('should have encoding utils', () => {
			expect(fs.existsSync(path.join(utilsDir, 'encodingUtils.ts'))).toBe(true);
		});

		it('should have trace utils', () => {
			expect(fs.existsSync(path.join(utilsDir, 'traceUtils.ts'))).toBe(true);
		});
	});
});

describe('Credentials Structure', () => {
	const credentialsDir = path.join(__dirname, '../credentials');

	it('should have network credentials', () => {
		expect(fs.existsSync(path.join(credentialsDir, 'MonadNetwork.credentials.ts'))).toBe(true);
	});

	it('should have API credentials', () => {
		expect(fs.existsSync(path.join(credentialsDir, 'MonadApi.credentials.ts'))).toBe(true);
	});
});

describe('Package Configuration', () => {
	const rootDir = path.join(__dirname, '..');
	
	it('should have package.json', () => {
		expect(fs.existsSync(path.join(rootDir, 'package.json'))).toBe(true);
	});

	it('should have LICENSE', () => {
		expect(fs.existsSync(path.join(rootDir, 'LICENSE'))).toBe(true);
	});

	it('should have README.md', () => {
		expect(fs.existsSync(path.join(rootDir, 'README.md'))).toBe(true);
	});

	it('should have tsconfig.json', () => {
		expect(fs.existsSync(path.join(rootDir, 'tsconfig.json'))).toBe(true);
	});

	describe('package.json content', () => {
		const pkg = require('../package.json');

		it('should have correct name', () => {
			expect(pkg.name).toBe('n8n-nodes-monad');
		});

		it('should have n8n configuration', () => {
			expect(pkg.n8n).toBeDefined();
			expect(pkg.n8n.nodes).toBeDefined();
			expect(pkg.n8n.credentials).toBeDefined();
		});

		it('should have required dependencies', () => {
			expect(pkg.dependencies.ethers).toBeDefined();
			expect(pkg.dependencies.axios).toBeDefined();
		});
	});
});
