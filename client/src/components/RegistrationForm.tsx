import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const getRegistrationSchema = (category: "adults" | "teens" | "little_stars") => {
  return z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    age: z.number().int().min(5, "Age must be at least 5").max(26, "Age must be 26 or younger"),
    phoneNumber: z.string().min(9, "Phone number must be at least 9 digits"),
    email: z.string().email("Invalid email address"),
    countySubLocation: z.string().min(2, "County sub-location is required"),
    photo: z.instanceof(File).optional(),
  }).refine((data) => {
    const age = data.age;
    if (category === "adults" && (age < 18 || age > 26)) {
      return false;
    }
    if (category === "teens" && (age < 13 || age > 17)) {
      return false;
    }
    if (category === "little_stars" && (age < 5 || age > 12)) {
      return false;
    }
    return true;
  }, {
    message: `Age must be within the ${category === "adults" ? "18–26" : category === "teens" ? "13–17" : "5–12"} range for this category`,
    path: ["age"],
  });
};

type RegistrationFormData = z.infer<ReturnType<typeof getRegistrationSchema>>;

interface RegistrationFormProps {
  category: "adults" | "teens" | "little_stars";
  onSuccess: () => void;
}

export default function RegistrationForm({ category, onSuccess }: RegistrationFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const submitRegistration = trpc.registration.submit.useMutation();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(getRegistrationSchema(category)),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      age: 18,
      phoneNumber: "",
      email: "",
      countySubLocation: "",
    },
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsUploading(true);

      let photoUrl = "";
      let photoKey = "";

      // Upload photo if provided
      if (data.photo) {
        const formData = new FormData();
        formData.append("file", data.photo);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Photo upload failed");
        }

        const uploadedFile = await uploadResponse.json();
        photoUrl = uploadedFile.url;
        photoKey = uploadedFile.key;
      }

      // Calculate age from date of birth
      const calculatedAge = calculateAge(data.dateOfBirth);

      // Submit registration
      await submitRegistration.mutateAsync({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        age: calculatedAge,
        category,
        phoneNumber: data.phoneNumber,
        email: data.email,
        countySubLocation: data.countySubLocation,
        photoUrl,
        photoKey,
      });

      toast.success("Registration submitted successfully!");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Display */}
        <div className="bg-[#1a0a1a] border-[#d4af37] border p-4 rounded-lg mb-4">
          <p className="text-white text-sm mb-1">Category:</p>
          <p className="text-[#d4af37] font-bold text-lg">
            {category === "adults" ? "Adults (18–26)" : category === "teens" ? "Teens (13–17)" : "Little Stars (5–12)"}
          </p>
        </div>

        {/* Full Name */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white placeholder-gray-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Date of Birth (YYYY-MM-DD)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., +254712345678"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white placeholder-gray-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white placeholder-gray-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* County Sub-Location */}
        <FormField
          control={form.control}
          name="countySubLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">County Sub-Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Chuka, Muthara, Magumoni"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white placeholder-gray-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Photo Upload */}
        <FormField
          control={form.control}
          name="photo"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel className="text-white">Profile Photo (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  className="bg-[#1a0a1a] border-[#d4af37] text-white file:bg-[#d4af37] file:text-black file:border-0 file:rounded cursor-pointer"
                  onChange={(e) => onChange(e.target.files?.[0])}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading || submitRegistration.isPending}
          className="w-full bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold text-lg py-6"
        >
          {isUploading || submitRegistration.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Submitting...
            </>
          ) : (
            "Submit Registration"
          )}
        </Button>
      </form>
    </Form>
  );
}
