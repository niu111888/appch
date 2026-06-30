import React from "react";
import { Composition, staticFile } from "remotion";
import { PhraseShort, sceneToDurationInFrames, Scene } from "./PhraseShort";
import { AppIcon } from "./AppIcon";
import { MascotGallery } from "./MascotGallery";
import { UraShort, sceneToFramesUra, UraScene } from "./UraShort";
import { TrapShort, sceneToFramesTrap, TrapScene } from "./TrapShort";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PhraseShort"
        component={PhraseShort}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={300}
        defaultProps={{}}
        calculateMetadata={async () => {
          // public/today.json を唯一の入力源にする。
          // build-today.mjs が毎回ここを書き換える。
          const res = await fetch(staticFile("today.json"));
          const scene = (await res.json()) as Scene;
          return {
            durationInFrames: sceneToDurationInFrames(scene, FPS),
            props: { scene },
          };
        }}
      />
      {/* 裏・中国語：表/裏フォーマット */}
      <Composition
        id="UraShort"
        component={UraShort}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={420}
        defaultProps={{}}
        calculateMetadata={async () => {
          const res = await fetch(staticFile("today-ura.json"));
          const scene = (await res.json()) as UraScene;
          return { durationInFrames: sceneToFramesUra(scene, FPS), props: { scene } };
        }}
      />
      {/* 罠クイズ：日本語と意味が違う／直訳厳禁シリーズ */}
      <Composition
        id="TrapShort"
        component={TrapShort}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={420}
        defaultProps={{}}
        calculateMetadata={async ({ props }) => {
          let scene = (props as { scene?: TrapScene }).scene;
          if (!scene) {
            const res = await fetch(staticFile("today-trap.json"));
            scene = (await res.json()) as TrapScene;
          }
          return { durationInFrames: sceneToFramesTrap(scene, FPS), props: { scene } };
        }}
      />
      {/* iOS AppIcon 書き出し用（1024x1024 の静止画） */}
      <Composition id="AppIcon" component={AppIcon} width={1024} height={1024} fps={FPS} durationInFrames={1} />
      {/* マスコット候補ギャラリー（比較用の静止画） */}
      <Composition
        id="MascotGallery"
        component={MascotGallery}
        width={1500}
        height={400}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{}}
        calculateMetadata={async () => {
          const res = await fetch(staticFile("mascot-candidates.json"));
          const candidates = await res.json();
          return { props: { candidates } };
        }}
      />
    </>
  );
};
