/**
 * ProductForm Component
 * Form for creating and editing marketplace products
 */

import { useState, useEffect } from "react";
import { useProductMutations } from "@/hooks/useMarketplace";
import { Product } from "@/services/marketplace.service";
import { useGeolocation } from "@/hooks/useGeolocation";
import { glassField, glassFieldError, glassLabel } from "@/lib/glass-form-styles";

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
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product;
  const { createProduct, updateProduct } = useProductMutations();
  const {
    location: userLocation,
    isLoading: locationLoading,
    error: locationError,
    getCurrentLocation,
  } = useGeolocation();

  // Auto-request the user's location on mount (required to create a listing).
  useEffect(() => {
    if (!isEditing && !userLocation && !locationLoading) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [condition, setCondition] = useState(product?.condition || "good");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [negotiable, setNegotiable] = useState(product?.negotiable ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 3 || title.length > 100) {
      newErrors.title = "Title must be between 3 and 100 characters";
    }

    if (!description.trim() || description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!price || parseFloat(price) < 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (!isEditing && images.length === 0 && imageUrls.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length + imageUrls.length + images.length > 5) {
      setErrors({ ...errors, images: "Maximum 5 images allowed" });
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
      !!userLocation &&
      typeof userLocation.latitude === "number" &&
      typeof userLocation.longitude === "number" &&
      !(userLocation.latitude === 0 && userLocation.longitude === 0);

    if (!hasValidExistingLoc && !hasValidUserLoc) {
      setErrors((prev) => ({
        ...prev,
        location:
          locationError ||
          "Location is required. Please allow location access and try again.",
      }));
      return;
    }

    const location = hasValidExistingLoc
      ? existingLoc!
      : {
          latitude: userLocation!.latitude,
          longitude: userLocation!.longitude,
          address: (userLocation as any)!.formattedAddress || (userLocation as any)!.address,
        };

    try {
      if (isEditing) {
        const result = await updateProduct.mutateAsync({
          productId: product.id,
          data: {
            title: title.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category,
            condition: condition as any,
            images: imageUrls,
            location,
          },
        });
        const productData = (result as any).data || result;
        onSuccess?.(productData);
      } else {
        const result = await createProduct.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
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
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className={glassLabel}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., iPhone 15 Pro Max - Like New"
          maxLength={100}
          className={`${glassField} ${errors.title ? glassFieldError : ""}`}
        />
        {errors.title && <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{errors.title}</p>}
        <p className="mt-1 text-xs text-[#3D5A3E]/70 dark:text-white/40">{title.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label className={glassLabel}>
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product in detail..."
          rows={6}
          className={`${glassField} resize-none ${errors.description ? glassFieldError : ""}`}
        />
        {errors.description && (
          <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{errors.description}</p>
        )}
      </div>

      {/* Price and Category Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={glassLabel}>
            Price (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className={`${glassField} ${errors.price ? glassFieldError : ""}`}
          />
          {errors.price && <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{errors.price}</p>}
        </div>

        <div>
          <label className={glassLabel}>
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${glassField} ${errors.category ? glassFieldError : ""}`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className={glassLabel}>Condition</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.value}
              type="button"
              onClick={() => setCondition(cond.value as typeof condition)}
              className={`rounded-2xl border-2 px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                condition === cond.value
                  ? "border-transparent bg-gradient-to-r from-primary to-[#006F35] text-white shadow-[0_8px_20px_rgba(0,212,49,0.28)] dark:from-emerald-500 dark:to-teal-600"
                  : "border-[var(--border-light)] bg-white/75 text-[#3D5A3E] hover:border-primary/35 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/75"
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <label className={glassLabel}>
          Images <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
          id="product-images"
        />
        <label
          htmlFor="product-images"
          className="block w-full cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.06] px-4 py-8 text-center text-sm font-medium text-[#3D5A3E] transition-colors hover:border-primary/50 hover:bg-primary/[0.1] dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-white/70"
        >
          <span className="material-symbols-outlined mx-auto mb-2 block text-4xl text-[#006F35]/60 dark:text-emerald-400/70">
            add_photo_alternate
          </span>
          Click to upload images (max 5)
        </label>
        {errors.images && <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{errors.images}</p>}

        {(images.length > 0 || imageUrls.length > 0) && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {imageUrls.map((url, idx) => (
              <div key={`url-${idx}`} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border-light)] dark:border-white/10">
                <img src={url} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx, true)}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
            {images.map((file, idx) => (
              <div key={`file-${idx}`} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border-light)] dark:border-white/10">
                <img src={URL.createObjectURL(file)} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx, false)}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEditing && (
        <div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--surface-light)]/80 px-4 py-3 dark:border-white/12 dark:bg-white/[0.05]">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--border-light)] text-primary focus:ring-primary/30 dark:border-white/20 dark:bg-white/10"
            />
            <span className="text-sm font-medium text-[#2E502E] dark:text-white/85">Price is negotiable</span>
          </label>
        </div>
      )}

      {!isEditing && (
        <div>
          {locationLoading && <p className="text-sm font-medium text-[#3D5A3E] dark:text-white/55">Detecting your location…</p>}
          {!locationLoading && userLocation && !(userLocation.latitude === 0 && userLocation.longitude === 0) && (
            <p className="rounded-2xl border border-primary/25 bg-primary/[0.08] px-4 py-3 text-sm font-medium text-[#006F35] dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Location set
              {(userLocation as any).formattedAddress
                ? `: ${(userLocation as any).formattedAddress}`
                : (userLocation as any).address
                  ? `: ${(userLocation as any).address}`
                  : ""}
            </p>
          )}
          {!locationLoading &&
            (!userLocation || (userLocation.latitude === 0 && userLocation.longitude === 0)) && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-400/40 bg-red-500/[0.08] p-4 dark:bg-red-500/10">
                <p className="text-sm font-medium text-red-700 dark:text-red-200">
                  {locationError || "Location is required to create a listing."}
                </p>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Enable
                </button>
              </div>
            )}
          {errors.location && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-300">{errors.location}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--border-light)] pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-[48px] w-full shrink-0 rounded-full border border-[var(--border-light)] bg-white px-4 text-sm font-bold text-brand-black shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-white sm:min-w-0 sm:flex-1"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || (!isEditing && locationLoading)}
          className="min-h-[48px] w-full shrink-0 rounded-full bg-gradient-to-r from-primary to-[#006F35] px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,212,49,0.35)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none dark:from-emerald-500 dark:to-teal-600 sm:min-w-0 sm:flex-1"
        >
          {isPending ? (isEditing ? "Updating…" : "Creating…") : isEditing ? "Save changes" : "Create listing"}
        </button>
      </div>
    </form>
  );
}
