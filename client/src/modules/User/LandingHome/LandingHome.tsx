import { Box } from "@mui/material";
import MainLayout from "../../../layout/MainLayout";
import Banner from "../../../components/Banner/Banner";
import VIPFunky from "../../../components/VIP-Funky/VIP-Funky";
import Description from "../../../components/Description/Description";
import VisualSection from "./components/VisualSection/VisualSection";
import SpecialDIY from "./components/SpecialDIY/SpecialDIY";
import MakeMoments from "./components/MakeMoments/MakeMoments";
import WhyChoose from "./components/WhyChoose/WhyChoose";
import BasketSliderNoTabs from "../../../components/BasketSlider/BasketSlider";
import SubscriptionModelSection from "./components/OurPremiumCards/OurPremiumCards";

const LandingHome = () => {
  // const { user } = useAuth();
  return (
    <MainLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
          justifyContent: "center",
          m: "auto",
          p: { lg: 3, md: 3, sm: 3, xs: 1 },
        }}
      >


        {/* Banner Area */}
        <Banner />

        <VisualSection />

        {/* Basket Slider Cards */}
        <BasketSliderNoTabs
          title="What would you personalise?"
          description="Shop Personalised cards, invites, gifts, clothing and home decor."
        />

        <MakeMoments />

        <SubscriptionModelSection/>

        <WhyChoose />

        {/* VIP Funkey just for offer */}
        <VIPFunky />

        <SpecialDIY />

        {/* Description */}
        <Description />
        <br />
      </Box>

    </MainLayout>
  );
};

export default LandingHome;
