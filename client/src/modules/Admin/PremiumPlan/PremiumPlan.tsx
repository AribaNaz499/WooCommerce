import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "./../../../layout/DashboardLayout";

import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import {
    Add,
    CheckCircleOutline,
    DeleteOutline,
    HighlightOff,
} from "@mui/icons-material";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { loadSubscriptionConfig, saveSubscriptionConfigWithStatus } from "../../../lib/subscriptionStore";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase/supabase";
import { defaultPricing, uid } from "../../../constant/data";
import { useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";


function FeatureIcon({ kind, highlight }: any) {
    if (kind === "cross") {
        return <HighlightOff fontSize="small" color={highlight ? "warning" : "error"} />;
    }
    return <CheckCircleOutline fontSize="small" color={highlight ? "warning" : "action"} />;
}

function InlineEditableText({
    value,
    onChange,
    isAdmin,
    typographySx,
    placeholder = "Click to edit",
    multiline = false,
    minRows = 1,
    inputSx,
}: any) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? "");
    const inputRef: any = useRef(null);

    useEffect(() => {
        setDraft(value ?? "");
    }, [value]);

    useEffect(() => {
        if (editing) setTimeout(() => inputRef.current?.focus(), 0);
    }, [editing]);

    const commit = () => {
        setEditing(false);
        onChange(draft);
    };

    const cancel = () => {
        setEditing(false);
        setDraft(value ?? "");
    };

    if (!isAdmin) {
        return <Typography sx={typographySx}>{value ? value : ""}</Typography>;
    }

    if (!editing) {
        return (
            <Typography
                onClick={() => setEditing(true)}
                sx={{
                    cursor: "text",
                    borderRadius: 1,
                    px: 0.5,
                    py: 0.25,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    ...typographySx,
                }}
            >
                {value ? value : placeholder ? (
                    <Box component="span" sx={{ color: "text.secondary" }}>
                        {placeholder}
                    </Box>
                ) : (
                    ""
                )}
            </Typography>
        );
    }

    return (
        <TextField
            inputRef={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !multiline) {
                    e.preventDefault();
                    commit();
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                }
            }}
            size="small"
            fullWidth
            multiline={multiline}
            minRows={minRows}
            sx={inputSx}
        />
    );
}

function PlanCardInline({ planIndex, control, watch, setValue, isAdmin }: any) {
    const planBase = `plans.${planIndex}`;
    const featuresName = `${planBase}.features`;
    const { fields, append, remove } = useFieldArray({ control, name: featuresName });

    const navigate = useNavigate()

    const highlight = Boolean(watch(`${planBase}.highlight`));
    const badgeText = watch(`${planBase}.badgeText`);

    // ✅ FIX: Free plan ke liye "/ per month" placeholder remove
    const planCode = watch(`${planBase}.code`);
    const priceSuffixPlaceholder = planCode === "free" ? "" : "/ per month";

    const toggleIcon = (idx: any) => {
        const current = watch(`${featuresName}.${idx}.icon`);
        setValue(`${featuresName}.${idx}.icon`, current === "cross" ? "check" : "cross", { shouldDirty: true });
    };

    const addFeature = () => {
        append({ id: uid(), text: "New feature", icon: "check" });
    };

    return (
        <Card
            elevation={highlight ? 20 : 2}
            sx={{
                borderRadius: 3,
                height: "100%",
                position: "relative",
                border: highlight ? "3px solid" : "1px solid",
                borderColor: highlight ? "warning.main" : "divider",
                overflow: "visible",
                mt: 4,
                width: "100%",
            }}
        >
            {badgeText ? (
                <Box
                    sx={{
                        position: "absolute",
                        top: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "warning.main",
                            color: "warning.contrastText",
                            px: 2,
                            py: 0.5,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: 0.4,
                            cursor: isAdmin ? "text" : "default",
                        }}
                    >
                        <Controller
                            control={control}
                            name={`${planBase}.badgeText`}
                            render={({ field }) => (
                                <InlineEditableText
                                    value={field.value}
                                    onChange={field.onChange}
                                    isAdmin={isAdmin}
                                    placeholder="(optional badge)"
                                    typographySx={{ fontSize: 11, fontWeight: 900 }}
                                    inputSx={{
                                        "& .MuiInputBase-root": { bgcolor: "background.paper" },
                                        minWidth: 220,
                                    }}
                                />
                            )}
                        />
                    </Box>
                </Box>
            ) : isAdmin ? (
                <Box
                    sx={{
                        position: "absolute",
                        top: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "rgba(0,0,0,0.06)",
                            px: 2,
                            py: 0.5,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                        }}
                    >
                        <Controller
                            control={control}
                            name={`${planBase}.badgeText`}
                            render={({ field }) => (
                                <InlineEditableText
                                    value={field.value}
                                    onChange={field.onChange}
                                    isAdmin={isAdmin}
                                    placeholder="Click to add badge"
                                    typographySx={{ fontSize: 11, fontWeight: 800 }}
                                    inputSx={{ minWidth: 220 }}
                                />
                            )}
                        />
                    </Box>
                </Box>
            ) : null}

            <CardContent sx={{ p: 2.5, pt: badgeText ? 4 : 2.5 }}>
                <Stack spacing={1.5}>
                    <Box>
                        <Controller
                            control={control}
                            name={`${planBase}.name`}
                            render={({ field }) => (
                                <InlineEditableText
                                    value={field.value}
                                    onChange={field.onChange}
                                    isAdmin={isAdmin}
                                    placeholder="Plan title"
                                    typographySx={{ fontSize: { md: 28, xs: 22 }, fontWeight: 900 }}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name={`${planBase}.tagline`}
                            render={({ field }) => (
                                <InlineEditableText
                                    value={field.value}
                                    onChange={field.onChange}
                                    isAdmin={isAdmin}
                                    placeholder="Plan description"
                                    typographySx={{ color: "gray", fontSize: 14, mt: 0.5 }}
                                    multiline
                                    minRows={2}
                                />
                            )}
                        />
                    </Box>

                    <Box>
                        <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                            <Controller
                                control={control}
                                name={`${planBase}.priceText`}
                                render={({ field }) => (
                                    <InlineEditableText
                                        value={field.value}
                                        onChange={field.onChange}
                                        isAdmin={isAdmin}
                                        placeholder="Price"
                                        typographySx={{ fontSize: { md: 34, xs: 28 }, fontWeight: 900 }}
                                        inputSx={{ maxWidth: 220 }}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name={`${planBase}.priceSuffix`}
                                render={({ field }) => (
                                    <InlineEditableText
                                        value={field.value}
                                        onChange={field.onChange}
                                        isAdmin={isAdmin}
                                        placeholder={priceSuffixPlaceholder}
                                        typographySx={{ fontSize: 16, fontWeight: 700, color: "text.secondary" }}
                                        inputSx={{ maxWidth: 260 }}
                                    />
                                )}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    <List dense sx={{ py: 0 }}>
                        {fields.map((f, idx) => {
                            const icon = watch(`${featuresName}.${idx}.icon`);
                            return (
                                <ListItem
                                    key={f.id}
                                    sx={{ px: 0, gap: 1, alignItems: "flex-start" }}
                                    disableGutters
                                    secondaryAction={
                                        isAdmin ? (
                                            <IconButton
                                                edge="end"
                                                aria-label="remove"
                                                onClick={() => remove(idx)}
                                                size="small"
                                                sx={{ mt: 0.2 }}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        ) : null
                                    }
                                >
                                    <ListItemIcon sx={{ minWidth: 34, mt: 0.3 }}>
                                        {isAdmin ? (
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleIcon(idx)}
                                                aria-label="toggle check/cross"
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 999,
                                                    width: 30,
                                                    height: 30,
                                                }}
                                            >
                                                <FeatureIcon kind={icon} highlight={highlight} />
                                            </IconButton>
                                        ) : (
                                            <FeatureIcon kind={icon} highlight={highlight} />
                                        )}
                                    </ListItemIcon>

                                    <Box sx={{ flex: 1, pt: 0.2 }}>
                                        <Controller
                                            control={control}
                                            name={`${featuresName}.${idx}.text`}
                                            render={({ field }) => (
                                                <InlineEditableText
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    isAdmin={isAdmin}
                                                    placeholder="Feature text"
                                                    typographySx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}
                                                    multiline
                                                    minRows={1}
                                                />
                                            )}
                                        />
                                    </Box>
                                </ListItem>
                            );
                        })}

                        {isAdmin ? (
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                                <IconButton
                                    onClick={addFeature}
                                    aria-label="add feature"
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 999,
                                        width: 44,
                                        height: 44,
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <Add />
                                </IconButton>
                            </Box>
                        ) : null}

                        {
                            planCode === "free" ? null : <Box sx={{ mt: 4, }}>
                                <LandingButton
                                 title={planCode === "bundle" ? "Edit Bundle" : "Edit Subscription"}
                                  personal 
                                  width={'200px'}
                                  onClick={()=> navigate(`${ADMINS_DASHBOARD.ADMIN_BUNDLES}/${planCode}`,{state:{code:planCode}})}
                                   />
                            </Box>
                        }

                    </List>
                </Stack>
            </CardContent>
        </Card>
    );
}

const PremiumPlan = ({ isAdmin = true, enableSupabase = true }) => {
    const defaults = useMemo(() => defaultPricing(), []);

    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: defaults,
        mode: "onChange",
    });

    const { control, handleSubmit, reset, watch, setValue } = form;
    const plans = watch("plans");



    useEffect(() => {
        if (!enableSupabase) return;
        if (!supabase) {
            toast.error("Supabase env missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
            return;
        }

        const run = async () => {
            try {
                setLoading(true);
                const remote = await loadSubscriptionConfig(supabase);
                if (remote) reset(remote);
                setLoading(false);
            } catch (e: any) {
                setLoading(false);
                toast.error(`Load failed: ${e.message}`);
            }
        };

        run();
    }, [enableSupabase, supabase, reset]);

    const onSubmit = async (values: any) => {
        if (!enableSupabase) {
            toast.success("Saved locally (enableSupabase=false)");
            return;
        }
        if (!supabase) {
            toast.error("Supabase client not initialized (check env vars)");
            return;
        }

        try {
            setLoading(true);
            const status = await saveSubscriptionConfigWithStatus(supabase, values);
            setLoading(false);

            if (status === "inserted") toast.success("Saved Successfully ✅");
            else toast.success("Update successfully ✅");
        } catch (e: any) {
            setLoading(false);
            toast.error(`Save failed: ${e.message}`);
        }
    };

    return (
        <DashboardLayout title="Pro Plans">
            <Box sx={{ width: "100%", bgcolor: "#e1f3f5", p: {md:3,sm:3,xs:2}, height: "auto" }}>
                <Container maxWidth="xl">
                    <Box sx={{ width: "100%", borderRadius: 2, textAlign: "center", height: "100%" }}>
                        <Stack spacing={1.2} alignItems="center">
                            {loading ? <CircularProgress size={22} /> : null}
                            <Controller
                                control={control}
                                name="page.title"
                                render={({ field }) => (
                                    <InlineEditableText
                                        value={field.value}
                                        onChange={field.onChange}
                                        isAdmin={isAdmin}
                                        placeholder="Page title"
                                        typographySx={{ fontSize: { md: 40, xs: 28 }, fontWeight: 900 }}
                                        inputSx={{ maxWidth: 700 }}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="page.subtitle"
                                render={({ field }) => (
                                    <InlineEditableText
                                        value={field.value}
                                        onChange={field.onChange}
                                        isAdmin={isAdmin}
                                        placeholder="Page description"
                                        typographySx={{
                                            fontSize: { md: 18, xs: 14 },
                                            width: { md: 820, xs: "100%" },
                                            color: "#444444",
                                        }}
                                        multiline
                                        minRows={3}
                                        inputSx={{ maxWidth: 900 }}
                                    />
                                )}
                            />

                            <Box sx={{ width: "100%", mt: 8, display: {md:"flex",sm:'flex',xs:'block'}, gap: 3 }}>
                                {plans?.map((plan, idx) => (
                                    <Box sx={{ width: "100%" }} key={plan.id}>
                                        <PlanCardInline
                                            planIndex={idx}
                                            control={control}
                                            watch={watch}
                                            setValue={setValue}
                                            isAdmin={isAdmin}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Stack>

                        <Box sx={{ mt: 15, gap: 2, display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
                            <LandingButton
                                title="Reset"
                                onClick={() => reset(defaults)}
                                loading={loading}
                                width="200px"
                                variant="outlined"
                                personal
                            />
                            <LandingButton
                                title="Submit"
                                onClick={handleSubmit(onSubmit)}
                                loading={loading}
                                width="200px"
                                personal
                            />
                        </Box>
                    </Box>
                </Container>
            </Box>
        </DashboardLayout>
    );
};

export default PremiumPlan;
