import { useEffect, useState } from "react";
import { Box, Typography, IconButton, List, ListItem } from "@mui/material";
import {
  ControlPoint,
  Delete,
  InfoOutline,
  PlayCircleOutline,
} from "@mui/icons-material";
import CustomButton from "../../CustomButton/CustomButton";
import TipsVideo from "/assets/images/diy-tips.mp4";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../context/AuthContext";
import { COLORS } from "../../../constant/color";
import toast from "react-hot-toast";
import { useSlide1 } from "../../../context/Slide1Context";

interface Video1PopupProps {
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

const Video1Popup = ({ onClose, activeIndex }: Video1PopupProps) => {
  const {
    tips1,
    setTips1,
    upload1,
    setUpload1,
    video1,
    setVideo1,
    duration1,
    setDuration1,
    setSelectedVideoUrl1,
    setQrPosition1,
    selectedVideoUrl1,
  } = useSlide1();

  const [loading, setLoading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { user } = useAuth();
  const generateId = () => Date.now() + Math.random();

  // ✅ Handle multiple video files
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setFileError(null);

    const validFiles: any = Array.from(files).filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        setFileError(`❌ ${file.name.slice(0, 20)} is too large (max 50MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    setVideo1(validFiles); // store as an array
  };

  // ✅ Save video URL to the user's "video" array in DB
  const saveVideoUrlToDB = async (videoId: string, videoUrl: string) => {
    if (!user?.id) {
      console.error("❌ No authenticated user found");
      return;
    }

    try {
      const { data: userData, error: fetchError } = await supabase
        .from("Users")
        .select("video")
        .eq("auth_id", user.id)
        .single();

      console.log("📦 Current user data:", userData);

      if (fetchError) {
        console.error("❌ Error fetching user data:", fetchError);
        return;
      }

      const newVideo = { id: videoId, url: videoUrl };
      const updatedVideos = userData?.video
        ? [...userData.video, newVideo]
        : [newVideo];

      console.log("🆕 New video array:", updatedVideos);

      const { error: updateError } = await supabase
        .from("Users")
        .update({ video: updatedVideos })
        .eq("auth_id", user.id);

      if (updateError) {
        console.error("❌ Error updating user videos:", updateError);
        return;
      }

      console.log("✅ Video URL saved successfully:", videoUrl);
    } catch (err) {
      console.error("❌ Error saving video to DB:", err);
    }
  };

  // ✅ Upload video to Supabase Storage
  const handleVideoUpload = async () => {
    if (!video1 || video1.length === 0) {
      alert("No video selected");
      return;
    }

    setLoading(true);

    try {
      for (const file of video1) {
        const videoId = generateId().toString();
        const fileExt = file.name.split(".").pop();
        const fileName = `${videoId}.${fileExt}`;
        const filePath = `video/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        await saveVideoUrlToDB(videoId, publicData.publicUrl);

        // Update qrPosition with the new video URL
        setQrPosition1((prev) => ({
          ...prev,
          url: publicData.publicUrl,
          zIndex: 1000, // Reset zIndex on new upload
        }));
      }

      toast.success("Your video uploaded successfully!");

      // ✅ Refresh the list immediately after upload
      await fetchUserVideos();

      setVideo1(null);
      setDuration1(0);
      setUpload1(true);
      // onClose();
    } catch (err) {
      console.error("Error uploading videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoDelete = () => {
    setVideo1(null);
  };

  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);

  // ✅ Fetch user videos
  const fetchUserVideos = async () => {
    if (!user?.id) return;
    console.log("🎯 Fetching videos for user:", user.id);

    const { data, error } = await supabase
      .from("Users")
      .select("video")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.error("❌ Error fetching videos:", error);
      return;
    }

    if (data?.video) {
      console.log("✅ Fetched user videos:", data.video);
      setUserVideos(
        (Array.isArray(data.video) ? data.video : [])
          .map((item: any, index: number) => toUserVideo(item, index))
          .filter((item: UserVideo | null): item is UserVideo => Boolean(item))
      );
    } else {
      console.log("⚠️ No videos found for user.");
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
  }, [user, selectedVideoUrl1]);

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
      setUserVideos(
        updated
          .map((item: any, index: number) => toUserVideo(item, index))
          .filter((item: UserVideo | null): item is UserVideo => Boolean(item))
      );
      toast.success("✅ Video deleted successfully");
    }
  };

  return (
    <PopupWrapper
      title="Video"
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 300, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        left: activeIndex === 0 ? { md: "13%", sm: "13%", xs: 0 } : "16%",
        mt: { md: 0, sm: 0, xs: 0 },
        overflowY: "hidden",
      }}
    >
      {tips1 && (
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          <Box
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
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
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
                  setTips1(false);
                  setUpload1(true);
                }}
              />
              <CustomButton
                title="Maybe Later"
                width="100%"
                variant="outlined"
                onClick={() => {
                  setTips1(false);
                  setUpload1(true);
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {upload1 && (
        <Box>
          {!video1 && (
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
                    color: "red",
                    fontSize: "13px",
                    mt: 1,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {fileError}
                </Typography>
              )}

              {userVideos.length > 0 && (
                <Box
                  mt={3}
                  sx={{
                    height: "400px",
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
                  <Typography
                    sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}
                  >
                    Your Uploaded Videos:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {userVideos.map((v) => (
                      <Box
                        key={v.id}
                        onClick={() =>
                          setSelectedVideoUrl1((prev) =>
                            prev === v.url ? null : v.url
                          )
                        }
                        sx={{
                          position: "relative",
                          border:
                            selectedVideoUrl1 === v.url
                              ? "3px solid #3a7bd5"
                              : "1px solid #ccc",
                          borderRadius: 2,
                          overflow: "hidden",
                          width: "100%",
                          cursor: "pointer",
                          opacity: selectedVideoUrl1 === v.url ? 1 : 0.9,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            borderColor: "#3a7bd5",
                            opacity: 1,
                          },
                        }}
                      >
                        {/* 🎥 Video */}
                        <video
                          id={`video-${v.id}`}
                          src={v.url}
                          controls={playingVideoId ? true : false}
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "contain",
                            // objectFit: "cover",
                          }}
                          onPlay={() => setPlayingVideoId(v.id)}
                          onPause={() => setPlayingVideoId(null)}
                          onEnded={() => setPlayingVideoId(null)}
                        />

                        {/* ▶ Overlay Play Button (hidden when playing) */}
                        {playingVideoId !== v.id && (
                          <Box
                            onClick={(e) => {
                              e.stopPropagation(); // prevent parent onClick
                              // Single click → select video (not play)
                              setSelectedVideoUrl1((prev) => (prev === v.url ? null : v.url));
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation(); // prevent parent click
                              const video = document.getElementById(`video-${v.id}`) as HTMLVideoElement;
                              if (video) {
                                // Pause all other videos
                                document.querySelectorAll("video").forEach((vid) => {
                                  if (vid !== video) vid.pause();
                                });
                                // Play this one
                                video.play();
                              }
                            }}
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              bgcolor: "rgba(0, 0, 0, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: "rgba(0, 0, 0, 0.4)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                bgcolor: "#fff",
                                borderRadius: "50%",
                                width: 50,
                                height: 50,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `3px solid ${COLORS.seconday}`,
                                outline: "2px solid white",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="30"
                                viewBox="0 0 24 24"
                                width="30"
                                fill="#412485ff"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </Box>
                          </Box>
                        )}

                        {/* 🗑 Delete Button */}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(v.id);
                          }}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "#fff",
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
            </>
          )}

          {video1 && (
            <Box sx={{ width: "100%", height: "200px", position: "relative" }}>
              <video
                src={URL.createObjectURL(video1[0])}
                controls
                autoPlay={false}
                onLoadedMetadata={(e) => setDuration1(e.currentTarget.duration)}
                style={{
                  width: "100%",
                  height: "100%",
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
                  <InfoOutline /> {(video1[0].size / (1024 * 1024)).toFixed(0)}{" "}
                  MB
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <PlayCircleOutline /> {Math.floor(duration1 ?? 0)}s
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
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

export default Video1Popup;
