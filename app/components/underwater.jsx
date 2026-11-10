import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dissolve = readFileSync(join(process.cwd(), 'reference', 'dissolve.html'), 'utf8');

export function Pond() {
  return (
    <canvas
      className="pond"
      id="pond"
      aria-hidden="true"
      data-src="/assets/koi/koi_a.webp"
      data-src2="/assets/koi/koi_b.webp"
    />
  );
}

export function Underwater() {
  return (
    <div className="egg" id="egg">
      <pre className="egg__fade" aria-hidden="true" dangerouslySetInnerHTML={{ __html: dissolve }} />
      <div className="egg__void" aria-hidden="true">
        <canvas
          className="egg__deep"
          id="deep"
          draggable="false"
          data-src="/assets/deep/angler_a.webp"
          data-dir="/assets/deep/"
        />
      </div>
    </div>
  );
}
