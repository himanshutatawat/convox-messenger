"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { BsGithub, BsGoogle } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Button from "../../components/Button";
import Input from "../../components/inputs/Input";
import LoadingModal from "../../components/modals/LoadingModal";
import AuthSocialButton from "./AuthSocialButton";

type Variant = "LOGIN" | "REGISTER";

const AuthForm = () => {
  const session = useSession();
  const router = useRouter();
  const [variant, setVariant] = useState<Variant>("LOGIN");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/conversations");
    }
  }, [session?.status, router]);

  const toggleVariant = useCallback(() => {
    if (variant === "LOGIN") {
      setVariant("REGISTER");
    } else {
      setVariant("LOGIN");
    }
  }, [variant]);

  const quickFillDemo = (name: string, email: string) => {
    setValue("name", name, { shouldValidate: true });
    setValue("email", email, { shouldValidate: true });
    setValue("password", "convox123", { shouldValidate: true });
    toast.success(`Filled demo: ${name}`);
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === "REGISTER") {
      axios
        .post("/api/register", data)
        .then(() => {
          toast.success("Account created successfully!");
          return signIn("credentials", data);
        })
        .catch((error) => {
          console.error("Register error:", error);
          toast.error("Registration failed. Please check details!");
        })
        .finally(() => setIsLoading(false));
    }

    if (variant === "LOGIN") {
      signIn("credentials", {
        ...data,
        redirect: false,
      })
        .then((callback) => {
          if (callback?.error) {
            toast.error("Invalid credentials! If new, please Register first.");
            return;
          }

          if (callback?.ok) {
            toast.success("Welcome back to ConvoX!");
            router.push("/conversations");
          }
        })
        .finally(() => setIsLoading(false));
    }
  };

  const socialAction = (action: string) => {
    setIsLoading(true);

    signIn(action, { redirect: false })
      .then((callback) => {
        if (callback?.error) {
          toast.error("Invalid credentials!");
          return;
        }

        if (callback?.ok) {
          toast.success("Logged in with " + action);
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      {session?.status === "loading" && <LoadingModal />}
      <div className="w-full">
        {/* Segmented Switch */}
        <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setVariant("LOGIN")}
            className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${variant === "LOGIN"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setVariant("REGISTER")}
            className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${variant === "REGISTER"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-md px-6 py-8 shadow-xl border border-slate-200/70 dark:border-slate-800/80 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {variant === "REGISTER" && (
              <Input
                disabled={isLoading}
                register={register}
                errors={errors}
                required
                id="name"
                label="Full Name"
              />
            )}
            <Input
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              id="email"
              label="Email address"
              type="email"
            />
            <Input
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              id="password"
              label="Password"
              type="password"
            />

            <div>
              <Button disabled={isLoading} fullWidth type="submit">
                {variant === "LOGIN" ? "Sign In to ConvoX" : "Create My Account"}
              </Button>
            </div>
          </form>

          {/* Quick Demo Fill Pill Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <HiSparkles className="text-amber-500" /> Quick fill test profile:
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => quickFillDemo("Alex Rivera", "alex@convox.app")}
                className="flex-1 py-1 px-2 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Alex (Demo 1)
              </button>
              <button
                type="button"
                onClick={() => quickFillDemo("Sophia Chen", "sophia@convox.app")}
                className="flex-1 py-1 px-2 text-xs rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Sophia (Demo 2)
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white dark:bg-[#1a1b1e] px-2 text-slate-400 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <AuthSocialButton icon={BsGithub} onClick={() => socialAction("github")} />
              <AuthSocialButton icon={BsGoogle} onClick={() => socialAction("google")} />
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div>{variant === "LOGIN" ? "New to ConvoX?" : "Already have an account?"}</div>
            <button
              type="button"
              onClick={toggleVariant}
              className="cursor-pointer font-semibold text-sky-500 hover:text-sky-600 hover:underline transition"
            >
              {variant === "LOGIN" ? "Create an account" : "Sign in here"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthForm;
