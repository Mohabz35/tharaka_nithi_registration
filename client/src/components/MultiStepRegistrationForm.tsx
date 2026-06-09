import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MultiStepRegistrationFormProps {
  category: "adults" | "teens" | "little_stars";
  onSuccess: (data: { participantName: string; registrationId: string }) => void;
}

type FormStep = "personal" | "talents" | "consent" | "review";

export default function MultiStepRegistrationForm({
  category,
  onSuccess,
}: MultiStepRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("personal");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); 
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    age: 0,
    phoneNumber: "",
    email: "",
    countySubLocation: "",
    talents: "",
    portfolioFile: null as File | null,
    consentPhotoVideo: false,
    consentDataProcessing: false,
    consentTerms: false,
    parentalConsentSigned: false,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const submitMutation = trpc.registration.submit.useMutation();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, portfolioFile: file });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value, type } = target as any;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (target as HTMLInputElement).checked,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = (e.target as HTMLInputElement).value;
    const age = calculateAge(dob);
    setFormData({ ...formData, dateOfBirth: dob, age });
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === "personal") {
      if (!formData.fullName) errors.fullName = "Full name is required";
      if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
      if (!formData.phoneNumber) errors.phoneNumber = "Phone number is required";
      if (!formData.email) errors.email = "Email address is required";
      if (!formData.countySubLocation) errors.countySubLocation = "County sub-location is required";
      if (!photoFile) errors.photo = "Photo upload is required";
      
      // Email validation
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
      
      // Phone validation (basic)
      if (formData.phoneNumber && !/^[0-9+\-\s()]+$/.test(formData.phoneNumber)) {
        errors.phoneNumber = "Please enter a valid phone number";
      }

      // Validate age based on category
      if (category === "adults" && (formData.age < 18 || formData.age > 26)) {
        errors.dateOfBirth = "Adults must be between 18 and 26 years old";
      } else if (category === "teens" && (formData.age < 13 || formData.age > 17)) {
        errors.dateOfBirth = "Teens must be between 13 and 17 years old";
      } else if (category === "little_stars" && (formData.age < 5 || formData.age > 12)) {
        errors.dateOfBirth = "Little Stars must be between 5 and 12 years old";
      }
    } else if (currentStep === "consent") {
      if (!formData.consentPhotoVideo) errors.consentPhotoVideo = "Photo/video consent is required";
      if (!formData.consentDataProcessing) errors.consentDataProcessing = "Data processing consent is required";
      if (!formData.consentTerms) errors.consentTerms = "You must accept the terms and conditions";
      if ((category === "teens" || category === "little_stars") && !formData.parentalConsentSigned) {
        errors.parentalConsent = "Parental consent is required for minors";
      }
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      // Upload photo to S3
      let photoUrl = "";
      let photoKey = "";
      if (photoFile) {
        const formDataPhoto = new FormData();
        formDataPhoto.append("file", photoFile);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: photoFile,
          headers: {
            "x-file-name": photoFile.name,
            "content-type": photoFile.type,
          },
        });
        const data = await response.json();
        photoUrl = data.url;
        photoKey = data.key;
      }

      // Upload portfolio if provided
      let portfolioUrl = "";
      let portfolioKey = "";
      if (formData.portfolioFile) {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData.portfolioFile,
          headers: {
            "x-file-name": formData.portfolioFile.name,
            "content-type": formData.portfolioFile.type,
          },
        });
        const data = await response.json();
        portfolioUrl = data.url;
        portfolioKey = data.key;
      }

      // Submit registration
      const result = await submitMutation.mutateAsync({
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        age: formData.age,
        category,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        countySubLocation: formData.countySubLocation,
        photoUrl,
        photoKey,
        talents: formData.talents,
        portfolioUrl,
        portfolioKey,
        consentPhotoVideo: formData.consentPhotoVideo,
        consentDataProcessing: formData.consentDataProcessing,
        consentTerms: formData.consentTerms,
        parentalConsentSigned: formData.parentalConsentSigned,
      });

      toast.success("Registration submitted successfully!");
      onSuccess({ 
        participantName: formData.fullName, 
        registrationId: result.registrationId || "REG-000" 
      });
    } catch (error) {
      toast.error("Failed to submit registration");
      console.error(error);
    }
  };

  const steps: FormStep[] = ["personal", "talents", "consent", "review"];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index <= currentStepIndex
                  ? "bg-[#d4af37] text-black"
                  : "bg-[#4a1a2a] text-[#d4af37] border-2 border-[#d4af37]"
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-12 mx-2 ${
                  index < currentStepIndex ? "bg-[#d4af37]" : "bg-[#4a1a2a]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      {currentStep === "personal" && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white block mb-2">Full Name *</label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.fullName ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="text-white block mb-2">Date of Birth *</label>
              <Input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleDateChange}
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.dateOfBirth ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.dateOfBirth}</p>
              )}
              {formData.age > 0 && (
                <p className="text-[#d4af37] text-sm mt-1">Age: {formData.age} years</p>
              )}
            </div>

            <div>
              <label className="text-white block mb-2">Phone Number *</label>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.phoneNumber ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.phoneNumber && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="text-white block mb-2">Email Address *</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.email ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="text-white block mb-2">County Sub-Location *</label>
              <Input
                name="countySubLocation"
                value={formData.countySubLocation}
                onChange={handleInputChange}
                placeholder="e.g., Maara, Chuka/Igambang'ombe, Tharaka South, etc."
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.countySubLocation ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.countySubLocation && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.countySubLocation}</p>
              )}
            </div>

            <div>
              <label className="text-white block mb-2">Upload Your Photo *</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={`bg-[#4a1a2a] text-white ${
                  fieldErrors.photo ? "border-red-500 border-2" : "border-[#d4af37]"
                }`}
              />
              {fieldErrors.photo && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.photo}</p>
              )}
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="mt-4 w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Talents & Portfolio */}
      {currentStep === "talents" && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Talents & Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white block mb-2">Describe Your Talents</label>
            <Textarea
              name="talents"
              value={formData.talents}
              onChange={(e: any) => setFormData({ ...formData, talents: e.target.value })}
              placeholder="Tell us about your talents, skills, and what makes you unique..."
              className="bg-[#4a1a2a] text-white border-[#d4af37] min-h-32"
            />
            </div>

            <div>
              <label className="text-white block mb-2">Upload Portfolio (Optional)</label>
              <p className="text-gray-400 text-sm mb-2">
                Upload your modeling portfolio, performance videos, or other talent demonstrations
              </p>
              <Input
                type="file"
                onChange={handlePortfolioChange}
                className="bg-[#4a1a2a] text-white border-[#d4af37]"
              />
              {formData.portfolioFile && (
                <p className="text-[#d4af37] text-sm mt-2">
                  File selected: {formData.portfolioFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Consent Forms */}
      {currentStep === "consent" && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Consent & Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.consentPhotoVideo}
                    onCheckedChange={(checked) => setFormData({ ...formData, consentPhotoVideo: checked as boolean })}
                    className={`mt-1 ${fieldErrors.consentPhotoVideo ? 'border-red-500' : ''}`}
                  />
                  <label className="text-white text-sm">
                    I consent to the use of my photographs and videos for event documentation, social media promotion, and marketing materials.
                  </label>
                </div>
                {fieldErrors.consentPhotoVideo && <p className="text-red-400 text-sm ml-7">{fieldErrors.consentPhotoVideo}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.consentDataProcessing}
                    onCheckedChange={(checked) => setFormData({ ...formData, consentDataProcessing: checked as boolean })}
                    className={`mt-1 ${fieldErrors.consentDataProcessing ? 'border-red-500' : ''}`}
                  />
                  <label className="text-white text-sm">
                    I consent to the processing of my personal data in accordance with the Data Protection Act 2019 for event registration, communication, and event management purposes.
                  </label>
                </div>
                {fieldErrors.consentDataProcessing && <p className="text-red-400 text-sm ml-7">{fieldErrors.consentDataProcessing}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.consentTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, consentTerms: checked as boolean })}
                    className={`mt-1 ${fieldErrors.consentTerms ? 'border-red-500' : ''}`}
                  />
                  <label className="text-white text-sm">
                    I accept the terms and conditions and understand that providing false information will result in disqualification.
                  </label>
                </div>
                {fieldErrors.consentTerms && <p className="text-red-400 text-sm ml-7">{fieldErrors.consentTerms}</p>}
              </div>

              {(category === "teens" || category === "little_stars") && (
                <div className={`flex flex-col gap-1 bg-[#4a1a2a] p-4 rounded-lg border ${fieldErrors.parentalConsent ? 'border-red-500' : 'border-[#d4af37]'}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={formData.parentalConsentSigned}
                      onCheckedChange={(checked) => setFormData({ ...formData, parentalConsentSigned: checked as boolean })}
                      className={`mt-1 ${fieldErrors.parentalConsent ? 'border-red-500' : ''}`}
                    />
                    <label className="text-white text-sm">
                      Parent/Guardian has reviewed and consented to all terms. I confirm that I have parental/guardian permission to participate.
                    </label>
                  </div>
                  {fieldErrors.parentalConsent && <p className="text-red-400 text-sm ml-7">{fieldErrors.parentalConsent}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === "review" && (
        <Card className="bg-[#2a0a1a] border-[#d4af37] border-2">
          <CardHeader>
            <CardTitle className="text-[#d4af37]">Review Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#d4af37] font-semibold">Full Name</p>
                <p className="text-white">{formData.fullName}</p>
              </div>
              <div>
                <p className="text-[#d4af37] font-semibold">Age</p>
                <p className="text-white">{formData.age} years</p>
              </div>
              <div>
                <p className="text-[#d4af37] font-semibold">Email</p>
                <p className="text-white">{formData.email}</p>
              </div>
              <div>
                <p className="text-[#d4af37] font-semibold">Phone</p>
                <p className="text-white">{formData.phoneNumber}</p>
              </div>
              <div>
                <p className="text-[#d4af37] font-semibold">County Sub-Location</p>
                <p className="text-white">{formData.countySubLocation}</p>
              </div>
              <div>
                <p className="text-[#d4af37] font-semibold">Category</p>
                <p className="text-white capitalize">
                  {category === "adults" ? "Adults (18-26)" : category === "teens" ? "Teens (13-17)" : "Little Stars (5-12)"}
                </p>
              </div>
            </div>

            {photoPreview && (
              <div>
                <p className="text-[#d4af37] font-semibold mb-2">Your Photo</p>
                <img
                  src={photoPreview}
                  alt="Your photo"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {formData.talents && (
              <div>
                <p className="text-[#d4af37] font-semibold">Talents</p>
                <p className="text-white">{formData.talents}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={() => {
            const prevIndex = Math.max(0, currentStepIndex - 1);
            setCurrentStep(steps[prevIndex]);
          }}
          disabled={currentStepIndex === 0}
          className="bg-[#4a1a2a] text-[#d4af37] hover:bg-[#5a2a3a] border border-[#d4af37]"
        >
          Previous
        </Button>

        {currentStepIndex < steps.length - 1 ? (
          <Button
            onClick={() => {
              if (validateStep()) {
                const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
                setCurrentStep(steps[nextIndex]);
              }
            }}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-[#d4af37] text-black hover:bg-[#e5c158] font-bold"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Registration"}
          </Button>
        )}
      </div>
    </div>
  );
}
