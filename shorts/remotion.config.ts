import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// H.264 / mp4。YouTube Shorts・Instagram Reels どちらもそのまま受け付ける。
Config.setCodec("h264");
