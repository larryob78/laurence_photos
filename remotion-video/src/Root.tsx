import React from "react";
import { Composition } from "remotion";
import { MeetupReminder } from "./MeetupReminder";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MeetupReminder"
        component={MeetupReminder}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
