import MultiStepRegistrationForm from "./MultiStepRegistrationForm";

interface RegistrationFormProps {
  category: "adults" | "teens" | "little_stars";
  onSuccess: () => void;
}

export default function RegistrationForm({ category, onSuccess }: RegistrationFormProps) {
  return <MultiStepRegistrationForm category={category} onSuccess={onSuccess} />;
}
