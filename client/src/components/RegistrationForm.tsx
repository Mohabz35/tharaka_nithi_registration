import MultiStepRegistrationForm from "./MultiStepRegistrationForm";

interface RegistrationFormProps {
  category: "adults" | "teens" | "little_stars";
  onSuccess: (data: {
    registrationId: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    countySubLocation: string;
    age: number;
  }) => void;
}

export default function RegistrationForm({ category, onSuccess }: RegistrationFormProps) {
  return <MultiStepRegistrationForm category={category} onSuccess={onSuccess} />;
}
