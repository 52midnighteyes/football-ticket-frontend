import { Formik, ErrorMessage, Form } from "formik";
import { changeAvatarSchema } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeAvatarApi } from "@/api/auth/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

export default function ChangeAvatarForm({
  handlePreview,
  onSuccess,
}: {
  handlePreview: (previewUrl: string) => void;
  onSuccess: () => void;
}) {
  const updateUser = useAuthStore((state) => state.setUser);
  const handleSubmit = async (values: { avatar: File | null }) => {
    try {
      if (!values.avatar) {
        toast.error("You need to pick a picture before uploading");
        return;
      }
      const formData = new FormData();
      formData.append("avatar", values.avatar);
      const response = await changeAvatarApi(formData);
      if (!response.data) throw new Error("Upload file failed");
      updateUser(response.data);
      onSuccess();
      toast.success("avatar uploaded!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload avatar";
      toast.error(message);
    }
  };

  const imagePreviewHandler = (file: File) => {
    handlePreview(URL.createObjectURL(file));
  };
  return (
    <Formik
      initialValues={{ avatar: null as File | null }}
      validationSchema={changeAvatarSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, setFieldValue }) => (
        <Form className="flex flex-col items-center gap-3">
          <Input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-xs cursor-pointer"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0] ?? null;
              setFieldValue("avatar", file);

              if (file) imagePreviewHandler(file);
            }}
          />
          <ErrorMessage
            name="avatar"
            component="div"
            className="text-destructive"
          />
          <Button type="submit" disabled={isSubmitting}>
            upload
          </Button>
        </Form>
      )}
    </Formik>
  );
}
