import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { authAPI } from "@/services/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";

const ViewOnlyProfile = () => {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(authUser);
    const [loading, setLoading] = useState(true);
    const isStudent = user?.role === "student";

    // Fetch fresh user data from API
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await authAPI.getCurrentUser();
                if (response.data.success) {
                    setUser(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Fallback to auth user if API fails
                setUser(authUser);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [authUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
                    <p className="text-muted-foreground">
                        View your personal information
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Profile Photo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Photo</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-4xl font-medium text-primary">
                                {user?.name?.charAt(0) || "U"}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{user?.name}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                        <CardDescription>
                            Your personal information (Read-only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Full Name
                                </label>
                                <div className="px-3 py-2 bg-muted/50 rounded-md">
                                    {user?.name || "Not set"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Email Address
                                </label>
                                <div className="px-3 py-2 bg-muted/50 rounded-md">
                                    {user?.email || "Not set"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Phone Number
                                </label>
                                <div className="px-3 py-2 bg-muted/50 rounded-md">
                                    {user?.phone || "Not set"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Date of Birth
                                </label>
                                <div className="px-3 py-2 bg-muted/50 rounded-md">
                                    {user?.dob ? new Date(user.dob).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : "Not set"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Gender
                                </label>
                                <div className="px-3 py-2 bg-muted/50 rounded-md capitalize">
                                    {user?.gender || "Not set"}
                                </div>
                            </div>

                            {isStudent && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Enrollment Number
                                        </label>
                                        <div className="px-3 py-2 bg-muted/50 rounded-md">
                                            {user?.enrollment_no || "Not set"}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Semester
                                        </label>
                                        <div className="px-3 py-2 bg-muted/50 rounded-md">
                                            {user?.semester ? `Semester ${user.semester}` : "Not set"}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Department
                                        </label>
                                        <div className="px-3 py-2 bg-muted/50 rounded-md">
                                            {user?.department || "Not set"}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2 mt-6">
                            <label className="text-sm font-medium text-muted-foreground">
                                Address
                            </label>
                            <div className="px-3 py-2 bg-muted/50 rounded-md min-h-[80px]">
                                {user?.address || "Not set"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Notice */}
                <Card className="border-primary/50">
                    <CardContent className="flex items-start gap-3 pt-6">
                        <User className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Profile Information</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your profile information is managed by the administrator.
                                If you need to update any details, please contact your administrator.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ViewOnlyProfile;
