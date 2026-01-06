import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Users, BookOpen, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await login(email, password, selectedRole);
      toast.success(`Welcome back! Logged in as ${selectedRole}`);
      navigate(`/${selectedRole}`);
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      role: 'admin',
      title: 'Administrator',
      icon: Shield,
      color: 'border-destructive/30 hover:border-destructive hover:bg-destructive/5',
      activeColor: 'border-destructive bg-destructive/10'
    },
    {
      role: 'teacher',
      title: 'Teacher',
      icon: Users,
      color: 'border-info/30 hover:border-info hover:bg-info/5',
      activeColor: 'border-info bg-info/10'
    },
    {
      role: 'student',
      title: 'Student',
      icon: BookOpen,
      color: 'border-success/30 hover:border-success hover:bg-success/5',
      activeColor: 'border-success bg-success/10'
    }];


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-primary-foreground">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">ClassFlow</h1>
            </div>
          </div>

          <div className="text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">
              Modern Learning<br />Management System
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Empowering education through technology. Manage courses, track progress,
              and connect with your learning community.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-primary-foreground/80">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">200+</p>
              <p className="text-sm">Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">5+</p>
              <p className="text-sm">Teachers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">10+</p>
              <p className="text-sm">Courses</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">ClassFlow</h1>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-muted-foreground mt-2">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Login as</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {roles.map((item) =>
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1 ${selectedRole === item.role ? item.activeColor : item.color}`
                      }>

                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{item.title}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isLoading} />

                {errors.email &&
                  <p className="text-xs text-destructive">{errors.email}</p>
                }
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={isLoading} />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">

                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password &&
                  <p className="text-xs text-destructive">{errors.password}</p>
                }
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => toast.info('To Reset Password Contact Jeet Pitale')}>

                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ?
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </> :

                  'Sign In'
                }
              </Button>
            </form>


          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-sm text-foreground font-semibold max-w-7xl mx-auto">
          <p>© 2025 ClassFlow. All rights reserved.</p>
          <p>Mustafa Khericha & Developed by Jeet Pitale </p>
        </div>
      </footer>
    </div>);

}
