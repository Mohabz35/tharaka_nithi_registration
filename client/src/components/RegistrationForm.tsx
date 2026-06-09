import MultiStepRegistrationForm from "./MultiStepRegistrationForm";

interface RegistrationFormProps {
  category: "adults" | "teens" | "little_stars";
  onSuccess: (data: { participantName: string; registrationId: string }) => void;
}

export default function RegistrationForm({ category, onSuccess }: RegistrationFormProps) {
  return <MultiStepRegistrationForm category={category} onSuccess={onSuccess} />;
}
