// VideoPopup.tsx
import { useEffect, useState } from "react";
import { Box, Typography, IconButton, List, ListItem } from "@mui/material";
import {
  ControlPoint,
  Delete,
  InfoOutline,
  PlayCircleOutline,
} from "@mui/icons-material";
import CustomButton from "../../CustomButton/CustomButton";
// import TipsVideo from "/assets/images/diy-tips.mp4";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../context/AuthContext";
import { useSlide2 } from "../../../context/Slide2Context";
import toast from "react-hot-toast";
import { COLORS } from "../../../constant/color";
import { handleAutoDeletedVideo } from "../../../lib/lib";

interface VideoPopupProps {
  onClose: () => void;
  activeIndex?: number;
}

type UserVideo = {
  id: string;
  url: string;
  name: string;
  size?: string;
  duration?: string;
};

const toUserVideo = (video: any, index: number): UserVideo | null => {
  const url = typeof video === "string" ? video : video?.url;
  if (typeof url !== "string" || !url.trim()) return null;

  const id =
    typeof video?.id === "string" && video.id.trim()
      ? video.id
      : `video-${index}-${url}`;
  const fallbackName = url.split("/").pop()?.split("?")[0] || "Video";
  const name =
    typeof video?.name === "string" && video.name.trim()
      ? video.name
      : fallbackName;

  return {
    id,
    url,
    name,
    size: typeof video?.size === "string" ? video.size : undefined,
    duration: typeof video?.duration === "string" ? video.duration : undefined,
  };
};

const VideoPopup = ({ onClose, activeIndex }: VideoPopupProps) => {
  const {
    tips,
    setTips,
    upload,
    setUpload,
    video,
    setVideo,
    duration,
    setDuration,
    setSelectedVideoUrl,
    setQrPosition,
    selectedVideoUrl,
  } = useSlide2();

  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDeleteMedia, setIsDeleteMedia] = useState('')

  const { user } = useAuth();
  const generateId = () => Date.now() + Math.random();

  // Handle multiple video files
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setFileError(null);

    const validFiles: any = Array.from(files).filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        setFileError(`Error: ${file.name.slice(0, 20)} is too large (max 50MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    setVideo(validFiles); // store as an array
  };

  // -----------------------------chanages---------------------------
  // Save video URL to the user's "video" array in DB
  const saveVideoUrlToDB = async (videoData: any) => {
    if (!user?.id) return;

    const { data: userData, error: fetchError } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      return;
    }

    const updatedVideos = userData?.video
      ? [...userData.video, videoData]
      : [videoData];

    const { error: updateError } = await supabase
      .from("Users")
      .update({ video: updatedVideos })
      .eq("auth_id", user.id);

    if (updateError) {
      console.error("Error updating videos:", updateError);
      return;
    }
  };


  // --------------------Changes =========================
  // Upload video to Supabase Storage
  const handleVideoUpload = async () => {
    if (!video || video.length === 0) {
      alert("No video selected");
      return;
    }

    setLoading(true);

    try {
      for (const file of video) {
        const videoId = generateId().toString();
        const fileExt = file.name.split(".").pop();
        const fileName = `${videoId}.${fileExt}`;
        const filePath = `video/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            metadata: {
              user_id: user?.id,
              created_at: new Date().toISOString(),
            },
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        const metadata = {
          id: videoId,
          url: publicData.publicUrl,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          duration: Math.floor(duration ?? 0) + "s",
        };

        await saveVideoUrlToDB(metadata);

        // Update qrPosition with the new video URL
        setQrPosition((prev) => ({
          ...prev,
          url: publicData.publicUrl,
          zIndex: 1000,
        }));

        toast.success("Your video uploaded successfully!");

        handleAutoDeletedVideo(user?.id, videoId, fileName, fetchUserVideos, 7 * 24 * 60 * 60 * 1000, setIsDeleteMedia);
      }

      await fetchUserVideos();
      setVideo(null);
      setDuration(0);
      setUpload(true);
    } catch (err) {
      console.error("Error uploading videos:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleVideoDelete = () => {
    setVideo(null);
  };

  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);


  // ------------------------------------changes-----------------------------------
  // Fetch user videos
  const fetchUserVideos = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching videos:", error);
      return;
    }

    if (Array.isArray(data?.video)) {
      const videos = data.video
        .map((item: any, index: number) => toUserVideo(item, index))
        .filter((item: UserVideo | null): item is UserVideo => Boolean(item));
      console.log("Fetched user videos:", videos);
      setUserVideos(videos);
    } else {
      console.log("No videos found for user.");
      setUserVideos([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadVideos = async () => {
      try {
        await fetchUserVideos();
      } catch (err) {
        console.error("Error loading videos:", err);
      }
    };

    loadVideos();
  }, [user, selectedVideoUrl]);


  // --------------------Chanages------------------------------------
  // Delete....
  const handleDeleteVideo = async (videoId: string) => {
    if (!user?.id) return;

    const { data: userData } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.video) return;

    const updated = userData.video.filter((v: any, index: number) => {
      const videoItem = toUserVideo(v, index);
      return videoItem?.id !== videoId;
    });

    const { error } = await supabase
      .from("Users")
      .update({ video: updated })
      .eq("auth_id", user.id);

    if (!error) {
      setUserVideos(updated);
      toast.success("Video deleted successfully");
    }
  };

  return (
    <PopupWrapper
      title="Video"
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 300, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        mt: { md: 0, sm: 0, xs: 0 },
        left: activeIndex === 1 ? { md: "17%", sm: "0%", xs: 0 } : "16%",
        overflowY: 'hidden',
      }}
    >
      {tips && (
        <Box sx={{ height: "100%", overflowY: "auto" }}>
          {/* <Box
            sx={{
              height: 200,
              width: "100%",
              bgcolor: "gray",
              position: "relative",
              display: { md: 'flex', sm: 'flex', xs: 'none' }
            }}
          >
            <video
              src={TipsVideo}
              autoPlay
              loop
              muted
              style={{ width: "100%", height: "100%", }}
            />
          </Box> */}
          <Box p={2}>
            <Typography
              sx={{
                fontSize: "23px",
                fontWeight: "bold",
                color: "#363636ff",
                textAlign: "center",
              }}
            >
              Add a Free Video Message!
            </Typography>
            <List
              component="ol"
              sx={{
                listStyleType: "decimal",
                fontSize: "14px",
                color: "#444444ff",
                pl: 2,
                "& .MuiListItem-root": {
                  display: "list-item",
                  padding: "4px",
                  margin: 0,
                },
              }}
            >
              <ListItem>You upload a Video recording</ListItem>
              <ListItem>We print a QR in the card</ListItem>
              <ListItem>They scan it to play the message</ListItem>
            </List>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 3 }}
            >
              <CustomButton
                title="Add Video"
                width="100%"
                onClick={() => {
                  setTips(false);
                  setUpload(true);
                }}
              />
              <CustomButton
                title="Maybe Later"
                width="100%"
                variant="outlined"
                onClick={() => {
                  setTips(false);
                  setUpload(true);
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {upload && (
        <Box>
          {!video && (
            <>
              <Box
                component="input"
                type="file"
                accept="video/*"
                sx={{
                  position: "absolute",
                  width: "260px",
                  height: "110px",
                  opacity: 0,
                  cursor: "pointer",
                  left: 20,
                  zIndex: 10,
                }}
                onChange={handleVideoFileChange}
                multiple
              />
              <Box
                sx={{
                  width: "100%",
                  height: "100px",
                  borderRadius: "8px",
                  border: "3px dashed #3a7bd5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                  color: "#3a7bd5",
                  fontWeight: "bold",
                  flexDirection: "column",
                  fontSize: "20px",
                }}
              >
                <ControlPoint fontSize="large" />
                Add Video
              </Box>

              {fileError && (
                <Typography
                  sx={{
                    fontSize: "13px",
                    mt: 1,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {fileError}
                </Typography>
              )}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {userVideos.length > 0 && (
                  <Box
                    mt={3}
                    sx={{
                      height: { md: '400px', sm: '450px', xs: "200px" },
                      overflowY: "auto",
                      p: 1,
                      "&::-webkit-scrollbar": {
                        height: "6px",
                        width: "5px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f1f1f1",
                        borderRadius: "20px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: COLORS.primary,
                        borderRadius: "20px",
                      },
                    }}
                  >
                    {
                      isDeleteMedia ? <Typography
                        sx={{ fontSize: "14px", fontWeight: "bold", mb: 1, color: 'red', opacity: 0.5 }}
                      >Your videos are deleted after one week</Typography> : <Box sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
                          Your Uploaded Videos:
                        </Typography>
                        <Box component="hr" sx={{ border: 0, borderTop: "1px solid #e0e0e0", my: 1 }} />
                        <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                          Double tap your video to load your qr code onto your card
                        </Typography>
                      </Box>
                    }

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {userVideos.map((v: UserVideo) => (
                        <Box
                          key={v.id}
                          onClick={() =>
                            setSelectedVideoUrl((prev) => (prev === v.url ? null : v.url))
                          }
                          sx={{
                            position: "relative",
                            border:
                              selectedVideoUrl === v.url
                                ? `3px solid ${COLORS.primary}`
                                : `1px solid ${COLORS.gray}`,
                            borderRadius: 2,
                            overflow: "hidden",
                            width: "100%",
                            cursor: "pointer",
                            opacity: selectedVideoUrl === v.url ? 1 : 0.9,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              opacity: 1,
                            },
                            p: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Video Info */}
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: "#333" }}>
                              {(v.name || "Video").slice(0, 15)}
                            </Typography>
                            <Typography sx={{ fontSize: "13px", color: "#575656ff" }}>
                              Duration: {v.duration || "-"} &nbsp; | &nbsp; Size: {v.size || "-"}
                            </Typography>
                          </Box>

                          {/* Delete Button */}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(v.id);
                            }}
                            sx={{
                              bgcolor: "#efefefff",
                              border: '1px solid gray',
                              "&:hover": { bgcolor: "#f3f0f0ff", color: "red" },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}

                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}

          {video && (
            <Box sx={{ width: "100%", height: { md: "500px", sm: "200px", xs: 300 }, position: "relative", overflowY: 'auto', }}>
              <Box
                component={'video'}
                src={URL.createObjectURL(video[0])}
                controls
                autoPlay={false}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                sx={{
                  width: "100%",
                  height: { md: "200px", sm: 200, xs: 150 },
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <IconButton
                onClick={handleVideoDelete}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "#f0f1f3",
                  "&:hover": { bgcolor: "#f0f1f3", color: "#fd1ecdff" },
                  zIndex: 99,
                }}
                size="small"
                aria-label="Delete uploaded video"
              >
                {/* Delete icon SVG or MUI icon */}
                <Delete />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  mt: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <InfoOutline /> {(video[0].size / (1024 * 1024)).toFixed(0)}{" "}
                  MB
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <PlayCircleOutline /> {Math.floor(duration ?? 0)}s
                </Typography>
              </Box>

              <Box
                sx={{
                  p: { xl: 3, lg: 3, md: 3, sm: 3, xs: 1 },
                  mt: 1,
                  borderTop: "1px solid #d3d3d3ff",
                  borderBottom: "1px solid #d3d3d3ff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 80, height: 80, cursor: "pointer" }}
                />
                <Typography sx={{ fontSize: "15px", color: "#929292ff" }}>
                  I confirm this video does not violate DIY Personalisation
                  content rule as outlined in{" "}
                  <Box
                    component="a"
                    href="#"
                    sx={{
                      textDecoration: "none",
                      color: "#3a7bd5",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    IDEA term and condition
                  </Box>
                </Typography>
              </Box>
              <br />
              <CustomButton
                title="Upload Video"
                width="90%"
                loading={loading}
                onClick={handleVideoUpload}
              />
            </Box>
          )}
        </Box>
      )}
    </PopupWrapper>
  );
};

export default VideoPopup;
