import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Lock } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { profileAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const profileSchema = z.object({
    fullName: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
    newPassword: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const AdminProfile = () => {
    const { user, updateUser } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to get full image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:')) return path; // Base64
        if (path.startsWith('http')) return path; // Full URL
        return `http://localhost:8000${path}`; // Append backend base URL
    };

    const [profileImage, setProfileImage] = useState(getImageUrl(user?.profile_photo));

    // Update state when user data changes (e.g. after save)
    useEffect(() => {
        setProfileImage(getImageUrl(user?.profile_photo));
    }, [user?.profile_photo]);

    const defaultValues = {
        fullName: user?.name || "",
        email: user?.email || "",
    };

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues,
    });

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data) {
        try {
            setIsSubmitting(true);
            const payload = { ...data, profilePhoto: profileImage };
            const response = await profileAPI.updateProfile(payload);

            if (response.data.success) {
                toast.success("Profile updated successfully!");
                updateUser(response.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onPasswordSubmit(data) {
        try {
            const response = await profileAPI.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            if (response.data.success) {
                toast.success("Password changed successfully!");
                setIsPasswordDialogOpen(false);
                passwordForm.reset();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to change password");
        }
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Profile Photo Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Photo</CardTitle>
                        <CardDescription>
                            Your profile picture
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setProfileImage(null)}
                                    />
                                ) : (
                                    <span className="text-4xl font-medium text-primary">
                                        {user?.name?.charAt(0) || "A"}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                Your profile picture helps others recognize you.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="john@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>
                            Manage your password and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your current password and choose a new one.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...passwordForm}>
                                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                        <FormField
                                            control={passwordForm.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Current Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={passwordForm.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>New Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={passwordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm New Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">
                                                Update Password
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminProfile;
