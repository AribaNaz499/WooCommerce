import { Route, Routes as ReactRoutes } from "react-router-dom";
import Home from "../../modules/User/Home/Home";
import Preview from "../../modules/User/Preview/Preview";
import { ADMINS_DASHBOARD, USER_ROUTES } from "../../constant/route";
import DashboardHome from "../../modules/Admin/Home/Home";
import Subscription from "../../modules/User/Subscription/Subscription";
import SuccessPayment from "../../modules/User/SuccessPayment/SuccessPayment";
import LandingHome from "../../modules/User/LandingHome/LandingHome";
import ViewAll from "../../modules/User/ViewAll/ViewAll";
import SignIn from "../../modules/User/Auth/SignIn";
import Products from "../../modules/Admin/Products/Products";
import AddNewProducts from "../../modules/Admin/AddNewProducts/AddNewProducts";
import Setting from "../../modules/Admin/Setting/Setting";
import SignUp from "../../modules/User/Auth/SignUp";
import AdminSignIn from "../../modules/Admin/Auth/SignIn";
import AddToCart from "../../modules/User/AddToCart/AddToCart";
import SecureRoute from "../../hoc/SecureRoute";
import AdminEditor from "../../modules/Admin/AdminEditor/AdminEditor";
import Reports from "../../modules/Admin/Reports/Reports";
import Categories from "../../modules/Admin/Categories/Categories";
import Orders from "../../modules/Admin/Orders/Orders";
import Blogs from "../../modules/User/Blogs/Blogs";
import BlogsDetails from "../../modules/User/BlogsDetails/BlogsDetails";
import Sustainibility from "../../modules/User/Sustainibility/Sustainibility";
import CommunityHub from "../../modules/User/CommunityHub/CommunityHub";
import OurBlogs from "../../modules/Admin/OurBlogs/OurBlogs";
import OurCommunityHub from "../../modules/Admin/OurCommunityHub/OurCommunityHub";
import AddCommunityPost from "../../modules/Admin/AddCommunityPost/AddCommunityPost";
import TempletEditor from "../../modules/User/TempletEditor/TempletEditor";
import CategoriesEditor from "../../modules/Admin/CategoriesEditor/CategoriesEditor";
import AdminPreview from "../../modules/Admin/AdminPreview/AdminPreview";
import TempletEditorPreview from "../../modules/User/TempletEditorPreview/TempletEditorPreview";
import CategoriesWisePreview from "../../modules/User/CategoriesWisePreview/CategoriesWisePreview";
import Customers from "../../modules/Admin/Customers/Customers";
import BlogsEditor from "../../modules/Admin/BlogsEditor/BlogsEditor";
import UploadToturial from "../../modules/Admin/UploadToturial/UploadToturial";
import UserProfile from "../../modules/User/UserProfile/UserProfile";
import AddNewTemplets from "../../modules/Admin/AddNewTemplets/AddNewTemplets";
import Draft from "../../modules/User/Drafts/Draft";
import PremiumPlan from "../../modules/Admin/PremiumPlan/PremiumPlan";
import PremiumPlans from "../../modules/User/PremiumPlans/PremiumPlans";
import OccasionBundle from "../../modules/Admin/OccasionBundle/OccasionBundle";

const Router = () => {
  return (
    <ReactRoutes>
      {/* Just For User preview */}
      <Route path={"/"} element={<LandingHome />} />
      <Route path={USER_ROUTES.OUR_BLOGS} element={<Blogs />} />
      <Route path={`${USER_ROUTES.OUR_BLOGS_DETAILS}/:id`} element={<BlogsDetails />} />
      <Route path={USER_ROUTES.OUR_SUSTAIANIBILITY} element={<Sustainibility />} />
      <Route path={`${USER_ROUTES.HOME}/:id`} element={<Home />} />
      <Route
        path={`${USER_ROUTES.TEMPLET_EDITORS}/:category/:productId`}
        element={<TempletEditor />}
      />
      <Route
        path={`${USER_ROUTES.TEMPLET_EDITORS_PREVIEW}/:category/:productId`}
        element={<TempletEditorPreview />}
      />
      <Route
        path={`${USER_ROUTES.CATEGORIES_EDITORS_PREVIEW}/:productId`}
        element={<CategoriesWisePreview />}
      />
      <Route path={USER_ROUTES.PREVIEW} element={<Preview />} />
      <Route path={`${USER_ROUTES.VIEW_ALL}/:search?`} element={<ViewAll />} />
      <Route path={`${USER_ROUTES.USER_DRAFTS_CARDS}`} element={<Draft />} />
      <Route path={USER_ROUTES.ADD_TO_CART} element={<AddToCart />} />
      <Route path={USER_ROUTES.PREMIUM_PLANS} element={<PremiumPlans />} />
      <Route path={USER_ROUTES.SUBSCRIPTION} element={<Subscription />} />
      <Route path={USER_ROUTES.COMMUNITY_HUB} element={<CommunityHub />} />
      <Route path={USER_ROUTES.SUCCESS_PAY} element={<SuccessPayment />} />
      <Route path={USER_ROUTES.SIGNIN} element={<SignIn />} />
      <Route path={USER_ROUTES.SIGNUP} element={<SignUp />} />
      <Route path={USER_ROUTES.USER_PROFILE} element={<UserProfile />} />

      {/* Just Admin dashboard Preview  */}
      <Route path={ADMINS_DASHBOARD.SIGNIN} element={<AdminSignIn />} />
      <Route
        path={ADMINS_DASHBOARD.HOME}
        element={
          <SecureRoute>
            <DashboardHome />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.CUSTOMERS}
        element={
          <SecureRoute>
            <Customers />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ORDERS_LIST}
        element={
          <SecureRoute>
            <Orders />
          </SecureRoute>
        }
      />

      <Route
        path={ADMINS_DASHBOARD.PRODUCTS_LIST}
        element={
          <SecureRoute>
            <Products />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADD_NEW_CARDS}
        element={
          <SecureRoute>
            <AddNewProducts />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADD_NEW_TEMPLETS_CARDS}
        element={
          <SecureRoute>
            <AddNewTemplets />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_CATEGORIES_EDITOR}
        element={
          <SecureRoute>
            <CategoriesEditor />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_CATEGORIES_EDITOR_PREIVEW}
        element={
          <SecureRoute>
            <AdminPreview />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_CATEGORIES}
        element={
          <SecureRoute>
            <Categories />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_EDITOR}
        element={
          <SecureRoute>
            <AdminEditor />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_BLOGS}
        element={
          <SecureRoute>
            <OurBlogs />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_BLOGS_EDITOR}
        element={
          <SecureRoute>
            <BlogsEditor />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_COMMUNITY_HUB}
        element={
          <SecureRoute>
            <OurCommunityHub />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_SUBSCRIPTION_PLANS}
        element={
          <SecureRoute>
            <PremiumPlan />
          </SecureRoute>
        }
      />
      <Route
        path={`${ADMINS_DASHBOARD.ADMIN_BUNDLES}/:plan`}
        element={
          <SecureRoute>
            <OccasionBundle />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_TOTURIAL_GUIDE}
        element={
          <SecureRoute>
            <UploadToturial />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADD_COMMUNITY_HUB_POST}
        element={
          <SecureRoute>
            <AddCommunityPost />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.ADMIN_REPORTS}
        element={
          <SecureRoute>
            <Reports />
          </SecureRoute>
        }
      />
      <Route
        path={ADMINS_DASHBOARD.SETTINGS}
        element={
          <SecureRoute>
            <Setting />
          </SecureRoute>
        }
      />
    </ReactRoutes>
  );
};

export default Router;
