import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    TextField,
    Typography,
    InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Search } from "@mui/icons-material";
import toast from "react-hot-toast";
import { supabase } from "../../supabase/supabase";

type TableTypes = {
    data?: any[];
    heading?: string[];
};

const TableList: React.FC<TableTypes> = ({ data = [], heading = [] }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState<string>("");
    const [isData, setIsData] = useState<any[]>(data);

    // ✅ Sync data from DB when prop changes
    useEffect(() => {
        setIsData(data);
    }, [data]);

    // ✅ Apply search filter dynamically
    const filteredData = isData.filter(
        (item) =>
            item?.name?.toLowerCase().includes(search?.toLowerCase()) ||
            item?.email?.toLowerCase().includes(search?.toLowerCase()) ||
            item?.id.toLowerCase().includes(search?.toLowerCase()) ||
            item?.orderStatus?.toLowerCase().includes(search?.toLowerCase())
    );

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allIds = filteredData.map((item) => item.id);
            setSelected(allIds);
        } else {
            setSelected([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelected((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleDelete = async () => {
        if (selected.length === 0) return;

        const confirmDelete = confirm(`Delete ${selected.length} orders?`);
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from("orders")
                .delete()
                .in("id", selected);
            if (error) {
                toast.error("Failed to delete orders");
                return;
            }

            // Remove from local UI
            setIsData(prev => prev.filter(order => !selected.includes(order.id)));

            toast.success("Order deleted successfully!");
            setSelected([]);

        } catch (err) {
            toast.error("Something went wrong");
        }
    };


    const allSelected =
        selected.length === filteredData.length && filteredData.length > 0;

    return (
        <Box>
            <Paper elevation={3} sx={{ borderRadius: 4 }}>
                {/* ✅ Header with Search + Delete */}
                <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
                    <TextField
                        placeholder="Search..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "gray" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            borderRadius: 50,
                            width: 300,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 50,
                            },
                        }}
                    />
                    <Box display="flex" gap={1}>
                        <IconButton
                            disabled={selected.length === 0}
                            onClick={handleDelete}
                            sx={{
                                border: `1px solid ${selected.length === 0 ? "gray" : "#d13232ff"
                                    }`,
                            }}
                        >
                            <DeleteIcon sx={{ color: selected.length === 0 ? "gray" : "red" }} />
                        </IconButton>
                    </Box>
                </Box>

                {/* ✅ Table */}
                <TableContainer sx={{ maxHeight: 700, overflowY: "auto" }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox checked={allSelected} onChange={handleSelectAll} />
                                </TableCell>
                                {
                                    heading.map((e) => (
                                        <TableCell key={e} sx={{ fontWeight: 600 }}>{e}</TableCell>
                                    ))
                                }
                            </TableRow>

                        </TableHead>

                        <TableBody>
                            {filteredData?.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selected.includes(row.id)}
                                            onChange={() => handleSelectOne(row.id)}
                                        />
                                    </TableCell>

                                    {/* 1. Order ID */}
                                    <TableCell>{row.sessionId}</TableCell>

                                    {/* 2. Name */}
                                    <TableCell>{row.name}</TableCell>

                                    {/* 3. Email */}
                                    <TableCell>{row.email}</TableCell>

                                    {/* 4. Payment Status */}
                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: row.paymentStatus === "Paid" ? "green" : "gray",
                                                fontWeight: 500,
                                                bgcolor:
                                                    row.paymentStatus === "Paid"
                                                        ? "#c3e49e58"
                                                        : "#cacaca6e",
                                                p: 1,
                                                borderRadius: 2,
                                                width: 100,
                                                textAlign: "center",
                                            }}
                                        >
                                            {row.paymentStatus}
                                        </Typography>
                                    </TableCell>

                                    {/* 5. Date */}
                                    <TableCell>{row.date}</TableCell>

                                    {/* 6. Order Status */}
                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color:
                                                    row.orderStatus === "Ready"
                                                        ? "orange"
                                                        : row.orderStatus === "Shipped"
                                                            ? "navy"
                                                            : "blue",
                                                fontWeight: 500,
                                                bgcolor:
                                                    row.orderStatus === "Ready"
                                                        ? "#e5b06539"
                                                        : row.orderStatus === "Shipped"
                                                            ? "#6278a161"
                                                            : "#0c87fb61",
                                                p: 1,
                                                borderRadius: 2,
                                                width: 100,
                                                textAlign: "center",
                                            }}
                                        >
                                            {row.orderStatus}
                                        </Typography>
                                    </TableCell>

                                    {/* 7. Total */}
                                    <TableCell sx={{ fontWeight: 'bold' }}>{row.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TableList;
