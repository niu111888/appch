import React from "react";
import { Composition, staticFile } from "remotion";
import { PhraseShort, sceneToDurationInFrames, Scene } from "./PhraseShort";
import { AppIcon } from "./AppIcon";

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
      {/* iOS AppIcon 書き出し用（1024x1024 の静止画） */}
      <Composition id="AppIcon" component={AppIcon} width={1024} height={1024} fps={FPS} durationInFrames={1} />
    </>
  );
};
