// packages/client/src/components/auth/AuthDialog.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, Chrome } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { LoginPayload, SignupPayload } from "@/types/auth";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  }) => void;
}

export function AuthDialog({ isOpen, onClose, onAuthenticated }: AuthDialogProps) {
  const { signIn, signUp } = useAuth(); // ✅ fixed
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ separate from isLoading
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const payload: LoginPayload = {
          email: formData.email,
          password: formData.password,
        };
        const { user, error } = await signIn(payload);
        if (error) throw new Error(error.message);
        toast({ title: "Welcome back!", description: "You are signed in." });
        if (user) {
          onAuthenticated({
            id: user.id,
            name: user.username,
            email: user.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          });
        }
      } else {
        const payload: SignupPayload = {
          username: formData.name,
          email: formData.email,
          password: formData.password,
        };
        const { user, error } = await signUp(payload);
        if (error) throw new Error(error.message);
        toast({ title: "Account created!", description: "You are signed up." });
        if (user) {
          onAuthenticated({
            id: user.id,
            name: user.username,
            email: user.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          });
        }
      }
      onClose();
    } catch (err: any) {
      toast({
        title: "Authentication failed",
        description: err.message || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser = {
        id: `google-user-${Date.now()}`,
        name: "John Doe",
        email: "john.doe@gmail.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      };
      onAuthenticated(mockUser);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      });
      onClose();
    } catch {
      toast({
        title: "Google sign-in failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    const guestUser = {
      id: `guest-${Date.now()}`,
      name: `Guest ${Math.floor(Math.random() * 1000)}`,
      email: "",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${Date.now()}`,
    };
    onAuthenticated(guestUser);
    toast({
      title: "Joined as guest",
      description: "You can collaborate on the whiteboard without signing up.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? "Sign in to Whiteboard" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {isLogin
              ? "Welcome back! Sign in to continue collaborating."
              : "Join the whiteboard to start collaborating with others."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            variant="outline"
            className="w-full h-11"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pr-10"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button onClick={handleGuestAccess} variant="outline" className="w-full">
              Continue as Guest
            </Button>
          </div>

          <div className="text-center text-sm">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
