/**
 * ProductForm Component
 * Form for creating and editing marketplace products
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductMutations } from "@/hooks/useMarketplace";
import { Product } from "@/services/marketplace.service";
import { useRegisteredLocation } from "@/hooks/useRegisteredLocation";
import { useAuth } from "@/hooks/useAuth";
import { SellerBadge } from "./SellerBadge";
import { glassField, glassFieldError, glassLabel } from "@/lib/glass-form-styles";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { useStarted } from "@/hooks/useStarted";
import { toKobo, fromKobo } from "@/lib/currency";
import apiClient from "@/lib/api-client";

interface ProductFormProps {
  product?: Product;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Sports",
  "Home & Garden",
  "Toys",
  "Vehicles",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product;
  const { createProduct, updateProduct } = useProductMutations();
  // Reuse the location the user declared at sign-up — no live GPS prompt.
  const {
    location: registeredLocation,
    isLoading: locationLoading,
    areaLabel,
  } = useRegisteredLocation();
  const { user } = useAuth();
  const myId = (user as any)?.id ?? (user as any)?._id;
  // Who you are is known only on the phone; wait so the first draw matches the pre-built page.
  const started = useStarted();

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  // product.price from the API is integer kobo — show naira in the input.
  const [price, setPrice] = useState(
    product?.price != null ? String(fromKobo(product.price)) : "",
  );
  const [category, setCategory] = useState(product?.category || "");
  const [condition, setCondition] = useState(product?.condition || "good");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [negotiable, setNegotiable] = useState(product?.negotiable ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 3 || title.length > 100) {
      newErrors.title = "Give it a name of 3 to 100 letters";
    }

    if (!description.trim() || description.length < 10) {
      newErrors.description = "Say a little more (at least 10 letters)";
    }

    if (!price || parseFloat(price) < 0) {
      newErrors.price = "Enter a price";
    }

    if (!category) {
      newErrors.category = "Choose a category";
    }

    if (images.length === 0 && imageUrls.length === 0) {
      newErrors.images = "Add at least one photo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length + imageUrls.length + images.length > 5) {
      setErrors({ ...errors, images: "5 photos at most" });
      return;
    }

    setImages([...images, ...validImages]);
    setErrors({ ...errors, images: "" });
  };

  const handleRemoveImage = (index: number, isUrl: boolean) => {
    if (isUrl) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    } else {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // For new listings we need a real location. Reject (0,0) and missing coords.
    const existingLoc = product?.location;
    const hasValidExistingLoc =
      !!existingLoc &&
      typeof existingLoc.latitude === "number" &&
      typeof existingLoc.longitude === "number" &&
      !(existingLoc.latitude === 0 && existingLoc.longitude === 0);

    const hasValidUserLoc =
      !!registeredLocation &&
      typeof registeredLocation.latitude === "number" &&
      typeof registeredLocation.longitude === "number" &&
      !(registeredLocation.latitude === 0 && registeredLocation.longitude === 0);

    if (!hasValidExistingLoc && !hasValidUserLoc) {
      setErrors((prev) => ({
        ...prev,
        location:
          "We couldn't find your registered location. Please set your home location in Settings, then try again.",
      }));
      return;
    }

    const location = hasValidExistingLoc
      ? existingLoc!
      : {
          latitude: registeredLocation!.latitude,
          longitude: registeredLocation!.longitude,
          state: registeredLocation!.state,
          lga: registeredLocation!.lga,
          ward: registeredLocation!.ward,
          neighborhood: registeredLocation!.neighborhood,
          address: registeredLocation!.formattedAddress,
        };

    try {
      if (isEditing) {
        let added: string[] = [];
        if (images.length > 0) {
          setUploading(true);
          try {
            const up = await apiClient.uploadFiles<{ files: { url: string }[] }>("/media/upload", images);
            added = (up.data?.files ?? []).map((f) => f.url).filter(Boolean);
          } finally {
            setUploading(false);
          }
          if (added.length !== images.length) throw new Error("Photo upload failed");
        }
        const result = await updateProduct.mutateAsync({
          productId: product.id,
          data: {
            title: title.trim(),
            description: description.trim(),
            price: toKobo(parseFloat(price)),
            category,
            condition: condition as any,
            images: [...imageUrls, ...added],
            location,
          },
        });
        const productData = (result as any).data || result;
        onSuccess?.(productData);
      } else {
        const result = await createProduct.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          price: toKobo(parseFloat(price)),
          category,
          condition: condition as any,
          images: images.length > 0 ? images : imageUrls,
          location,
          negotiable,
        });
        const productData = (result as any).data || result;
        onSuccess?.(productData);
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      setErrors((prev) => ({ ...prev, images: images.length ? "Could not save. Check your connection and try again." : prev.images }));
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending || uploading;

  const photoCount = images.length + imageUrls.length;
  const fieldError = (key: string) =>
    errors[key] ? <p role="alert" className="mt-1.5 text-[13px] font-bold text-brand-red">{errors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Photos first: buyers look at them before anything else. */}
      <div>
        <p className={glassLabel}>
          Photos <span className="font-semibold text-muted">({photoCount}/5)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, idx) => (
            <div key={`url-${idx}`} className="relative aspect-square overflow-hidden rounded-2xl bg-background">
              <Image src={url} alt={`Photo ${idx + 1}`} fill sizes="33vw" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx, true)}
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-navy/80 text-white"
                aria-label={`Remove photo ${idx + 1}`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden>close</span>
              </button>
            </div>
          ))}
          {images.map((file, idx) => (
            <div key={`file-${idx}`} className="relative aspect-square overflow-hidden rounded-2xl bg-background">
              <Image src={URL.createObjectURL(file)} alt={`New photo ${idx + 1}`} fill unoptimized sizes="33vw" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx, false)}
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-navy/80 text-white"
                aria-label={`Remove new photo ${idx + 1}`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden>close</span>
              </button>
            </div>
          ))}
          {photoCount < 5 ? (
            <label
              htmlFor="product-images"
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-background text-center text-[13px] font-bold text-brand-green-dark hover:border-primary"
            >
              <span className="material-symbols-outlined text-[28px]" aria-hidden>add_photo_alternate</span>
              Add photo
            </label>
          ) : null}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="sr-only" id="product-images" />
        {fieldError('images')}
      </div>

      <div>
        <label htmlFor="product-title" className={glassLabel}>What are you selling?</label>
        <input
          id="product-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Samsung 43-inch TV"
          maxLength={100}
          className={`${glassField} ${errors.title ? glassFieldError : ""}`}
        />
        {fieldError('title')}
      </div>

      <div>
        <label htmlFor="product-price" className={glassLabel}>Price</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-navy" aria-hidden>₦</span>
          <input
            id="product-price"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            className={`${glassField} pl-9 ${errors.price ? glassFieldError : ""}`}
          />
        </div>
        {fieldError('price')}
        {!isEditing ? (
          <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold text-navy">
            Buyers can make an offer
            <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="h-5 w-5 accent-[#0E8A3E]" />
          </label>
        ) : null}
      </div>

      <div>
        <label htmlFor="product-category" className={glassLabel}>Category</label>
        <select
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${glassField} ${errors.category ? glassFieldError : ""}`}
        >
          <option value="">Choose a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {fieldError('category')}
      </div>

      <div>
        <p className={glassLabel}>Condition</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Condition">
          {CONDITIONS.map((cond) => (
            <FilterChip key={cond.value} active={condition === cond.value} onClick={() => setCondition(cond.value as typeof condition)}>
              {cond.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="product-description" className={glassLabel}>Description</label>
        <textarea
          id="product-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Size, age, any faults, and where to meet."
          rows={5}
          className={`${glassField} resize-y ${errors.description ? glassFieldError : ""}`}
        />
        {fieldError('description')}
      </div>

      {!isEditing ? (
        locationLoading ? (
          <p className="text-[13px] text-muted">Finding your area…</p>
        ) : registeredLocation ? (
          <p className="flex items-center gap-2 rounded-2xl bg-green-soft px-4 py-3 text-[13px] font-semibold text-brand-green-dark">
            <span className="material-symbols-outlined text-[18px]" aria-hidden>location_on</span>
            Shown to people in {areaLabel || 'your area'}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-red-soft px-4 py-3">
            <p className="text-[13px] font-semibold text-[#B42318]">Set your home area first, so neighbours can find your item.</p>
            <Link href="/settings/location" className="shrink-0 rounded-full bg-brand-red px-4 py-2 text-[13px] font-bold text-white">
              Set area
            </Link>
          </div>
        )
      ) : null}
      {fieldError('location')}

      {started && !isEditing && myId ? (
        <div className="rounded-2xl bg-background px-4 py-3">
          <p className="mb-1.5 text-[13px] font-bold text-muted">Your seller level</p>
          <SellerBadge sellerId={myId} showProgress />
        </div>
      ) : null}

      <div className="flex gap-3 border-t border-line/70 pt-4">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending} className="flex-1">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={isPending} disabled={!isEditing && locationLoading} className="flex-[2]">
          {isEditing ? "Save changes" : "List item"}
        </Button>
      </div>
    </form>
  );
}
