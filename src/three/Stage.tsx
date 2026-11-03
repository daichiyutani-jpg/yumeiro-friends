import { Canvas, useThree } from '@react-three/fiber';
import { useLayoutEffect, type ReactNode } from 'react';

type V3 = [number, number, number];

function LookAt({ target }: { target: V3 }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
  }, [camera, target]);
  return null;
}

/**
 * 3D表示の共通設定。画素密度を抑え（最大1.5倍。スマホで描画が重いとタップの反応が遅れるため）、影はシャドウマップを使わず丸い影で表現して軽くする。
 * パステルの色が くすまないように トーンマッピングは使わない（flat）。
 * タブが見えない間は requestAnimationFrame が止まるので、描画も自動的に止まる。
 */
export function Stage({ children, fov = 50, camera = [0, 8, 12], target, className = 'canvas-wrap' }: { children: ReactNode; fov?: number; camera?: V3; target?: V3; className?: string }) {
  return (
    <div className={className}>
      <Canvas dpr={[1, 1.5]} camera={{ fov, position: camera, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'default' }} flat>
        {target && <LookAt target={target} />}
        {children}
      </Canvas>
    </div>
  );
}
