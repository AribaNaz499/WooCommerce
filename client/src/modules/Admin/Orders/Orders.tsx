import { useEffect, useState } from "react";
import TableList from "../../../components/TableList/TableList";
import DashboardLayout from "../../../layout/DashboardLayout";
import { fetchAllOrders } from "../../../source/source";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type OrderRow = {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  date: string;
  paymentStatus: string;
  orderStatus: string;
  total: string;
  cardSize?: string;
};

const Orders = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result: any[] = await fetchAllOrders();

        const formatted: OrderRow[] = result.map((item) => ({
          id: String(item.id ?? ""),
          sessionId: String(item.session_id ?? "").slice(0, 20),
          name: String(item.user_name ?? ""),
          email: String(item.user_email ?? ""),
          date: item.created_at ? new Date(item.created_at).toLocaleString() : "",
          cardSize: String(item.card_size ?? ""),
          paymentStatus: item.status === "paid" ? "Paid" : "Pending",
          orderStatus: "Completed",
          total: "£" + String(item.amount ?? "0"),
        }));

        setOrders(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    loadOrders();
  }, []);

  const handleExportOrdersPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(16);
    doc.text("Orders Report", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [[
        "OrderId",
        "SessionId",
        "Name",
        "Email",
        "Payment",
        "Date/Time",
        "Order Status",
        "Total",
      ]],
      body: orders.map((o) => ([
        o.id,
        o.sessionId,
        o.name,
        o.email,
        o.paymentStatus,
        o.date,
        o.orderStatus,
        o.total,
      ])),
      styles: { fontSize: 9 },
      headStyles: { fontStyle: "bold" },
      margin: { left: 40, right: 40 },
    });

    const fileName = `orders-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <DashboardLayout
      title="Orders"
      exportBtn="Export File"
      onExportClick={handleExportOrdersPdf}
    >
      <TableList
        data={orders}
        heading={[
          "OrdersId",
          "Name",
          "Email",
          "Payment_Status",
          "Date/Time",
          "Order_Status",
          "Total",
        ]}
      />
    </DashboardLayout>
  );
};

export default Orders;
