
import React from "react";

const Preloader = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
            <div className="relative flex flex-col items-center">
                {/* Animated Logo Container */}
                <div className="relative w-24 h-24 mb-8">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-[spin_3s_linear_infinite]" />

                    {/* Inner Ring */}
                    <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite]" />

                    {/* Center Dot */}
                    <div className="absolute inset-[38%] rounded-full bg-primary animate-pulse" />
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-pulse">
                        ClassFlow
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase animate-fade-in">
                        Loading your experience...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
