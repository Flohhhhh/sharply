// TODO: this is just an idea of how to structure this:
// - users will be presented with a input to build a "video recording mode" using drop downs and text inputs
// - we will store an array of these video recording modes in the database under jsonb
// - we will format and group these video recording modes for display in the UI on camera specs
// - note: these will not be used as enums in the database at all, just for presenting input options to user

// used to provide preset options when entering video resolution
export const COMMON_VIDEO_RESOLUTIONS = [
  {
    id: "1",
    label: "1080p",
    horizontalPixels: 1920,
    verticalPixels: 1080,
  },
  {
    id: "2",
    label: "1440p",
    horizontalPixels: 2560,
    verticalPixels: 1440,
  },
  {
    id: "3",
    label: "4k",
    horizontalPixels: 3840,
    verticalPixels: 2160,
  },
  {
    id: "4",
    label: "6k",
    horizontalPixels: 6144,
    verticalPixels: 3160,
  },
  {
    id: "5",
    label: "8k",
    horizontalPixels: 7680,
    verticalPixels: 4320,
  },
];
export type VideoResolution = (typeof COMMON_VIDEO_RESOLUTIONS)[number];

// list of available frame rate options for frame rate drop down
export const VIDEO_FRAME_RATES = [
  {
    id: "1",
    value: "24",
  },
  {
    id: "2",
    value: "25",
  },
  {
    id: "3",
    value: "30",
  },
  {
    id: "4",
    value: "50",
  },
  {
    id: "5",
    value: "60",
  },
  {
    id: "6",
    value: "100",
  },
  {
    id: "7",
    value: "120",
  },
];
export type VideoFrameRate = (typeof VIDEO_FRAME_RATES)[number];

// list of available codec options for codec drop down
export const VIDEO_CODECS = [
  {
    id: "1",
    value: "H.264",
  },
  {
    id: "2",
    value: "H.265",
  },
  {
    id: "3",
    value: "HEVC",
  },
  {
    id: "4",
    value: "ProRes Raw HQ",
  },
  {
    id: "5",
    value: "ProRes 422 HQ",
  },
  {
    id: "6",
    value: "N-Raw",
  },
];

export type VideoCodec = (typeof VIDEO_CODECS)[number];

// list of available color depth options for color depth drop down
export const VIDEO_COLOR_DEPTHS = [
  {
    id: "1",
    value: "8",
  },

  {
    id: "2",
    value: "10",
  },
  {
    id: "3",
    value: "12",
  },
  {
    id: "4",
    value: "14",
  },
];
export type VideoColorDepth = (typeof VIDEO_COLOR_DEPTHS)[number];

// shape for an array of video recording modes on camera specs
// will be presented to user as a formatted and grouped list
export type VideoRecordingMode = {
  horizontalPixels: number;
  verticalPixels: number;
  frameRate: VideoFrameRate;
  codec: VideoCodec;
  colorDepth: VideoColorDepth;
};
