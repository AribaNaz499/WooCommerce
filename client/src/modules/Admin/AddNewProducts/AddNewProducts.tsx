import { ADMINS_DASHBOARD } from "../../../constant/route";
import DashboardLayout from "../../../layout/DashboardLayout";
import NewCardForm from "./component/NewCardsForm";
import { useLocation, useNavigate } from "react-router-dom";

const AddNewProducts = () => {
  const location = useLocation();
  const { id, product } =
    (location.state as { id?: number; product?: any }) || {};
  const navigate = useNavigate()

  return (
    <DashboardLayout title={id ? "Edit Product" : "Add New Product"} addBtn="Add templet" onClick={() => navigate(ADMINS_DASHBOARD.ADMIN_CATEGORIES_EDITOR)}>
      <NewCardForm editProduct={product} />
    </DashboardLayout>
  );
};

export default AddNewProducts;
