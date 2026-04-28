import { Box, Typography } from "@mui/material";
import { COLORS } from "../../constant/color";
import { useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../constant/route";

type CategoryType = {
  id?: number;
  poster?: string;
  title?: string;
  borderColor?: string;
  seasonalCard?: boolean,
  key?: number
  
};

const CategoryCard = (props: CategoryType) => {
  const { id, poster, title, borderColor, seasonalCard } = props;
  const navigate = useNavigate();

   const go = () => {
    const name = title || "";
    navigate(`${USER_ROUTES.VIEW_ALL}/${encodeURIComponent(name)}`, {
      state: { categoryId: id ?? null, categoryName: name },
    });
  };

  return (
    <Box
      component={"div"}
     onClick={go}
      key={id}
      sx={{
        border: "3px solid lightgray",
        borderRadius: 2,
        p: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: { md: "175px", sm: "120px", xs: "100px" },
        height: { md: seasonalCard ? 200 : "175px", sm: seasonalCard ? 175 : "130px", xs: "130px" },
        alignItems: "center",
        textAlign: "center",
        bgcolor: COLORS.white,
        cursor: "pointer",
        transition: "border-color 0.3s ease",
        "&:hover": {
          borderColor: borderColor,
          borderWidth: 3,
        },
        "&:hover img": {
          transform: "scale(1.1)",
        },
      }}
    >
      <Box
        component={"img"}
        src={poster}
        alt="categoryImg"
        sx={{
          width: { md: "100px", sm: "70px", xs: "60px" },
          height: { md: "100px", sm: "70px", xs: "60px" },
          borderRadius: "50%",
          objectFit: "cover",
          transition: "transform 0.3s ease",
        }}
      />
      <Typography
        sx={{
          mt: 2,
          fontWeight: 600,
          fontSize: { md: "15px", sm: "", xs: "12px" },
          color: "#212121",
          display: "flex",
          flexWrap: "wrap",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default CategoryCard;
