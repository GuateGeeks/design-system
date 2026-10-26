// Tests read workspace packages from source through the `source` export condition.
// The lab build does not: it resolves the packages' default (dist) exports.
export const sourceConditions = {
  resolve: { conditions: ['source', 'module', 'browser', 'development|production'] },
  ssr: { resolve: { conditions: ['source', 'module', 'node', 'development|production'], externalConditions: ['source'] } },
};
