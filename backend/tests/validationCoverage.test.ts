import fs from 'node:fs';
import path from 'node:path';

describe('Joi route coverage', () => {
  it('không còn route đang hoạt động dùng inline/manual validator', () => {
    const routeDir = path.resolve('backend/routes');
    const violations: string[] = [];
    for (const name of fs.readdirSync(routeDir).filter((file) => file.endsWith('.ts'))) {
      const source = fs.readFileSync(path.join(routeDir, name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      source.split(/\r?\n/).forEach((line, index) => {
        if (/router\.(get|post|put|patch|delete)/.test(line) && /validate\(\s*\(/.test(line)) {
          violations.push(`${name}:${index + 1}`);
        }
        if (/router\.(get|post|put|patch|delete)/.test(line) && /validate\(\s*(?:[a-z]\w*Validator|listValidator|idValidator|validator|imageValidator)\s*\)/.test(line)) {
          violations.push(`${name}:${index + 1}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
