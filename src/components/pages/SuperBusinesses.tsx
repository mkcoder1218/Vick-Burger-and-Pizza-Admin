import React, { useMemo, useState } from "react";
import { Edit2, Plus, Store, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import Skeleton from "../ui/Skeleton";
import {
  buildUrl,
  createOne,
  deleteOne,
  getToken,
  updateOne,
  useGetAll,
} from "../../swr";

type ApiFile = { id: string; url: string };

type ApiBusiness = {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  isActive: boolean;
  logoFileId?: string | null;
  logoFile?: ApiFile | null;
  chapaPublicKey?: string | null;
  chapaSecretKey?: string | null;
};

type ListResponse<T> = { success: boolean; data: T[] };

const RESOURCE = "api/super-admin/businesses";

export default function SuperBusinesses() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, error, isLoading, mutate } = useGetAll<
    ListResponse<ApiBusiness>
  >(RESOURCE, {
    q: q || undefined,
    limit: 50,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const businesses = useMemo(() => data?.data ?? [], [data]);
  const paged = useMemo(
    () => businesses.slice(page * limit, (page + 1) * limit),
    [businesses, page],
  );

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiBusiness | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [chapaPublicKey, setChapaPublicKey] = useState("");
  const [chapaSecretKey, setChapaSecretKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editChapaPublicKey, setEditChapaPublicKey] = useState("");
  const [editChapaSecretKey, setEditChapaSecretKey] = useState("");
  const [editError, setEditError] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);

  const uploadLogo = async (file?: File | null) => {
    if (!file) return undefined;
    const token = getToken();
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(buildUrl("/api/files"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "Upload failed");
    }

    return data?.data?.id as string | undefined;
  };

  const resetCreate = () => {
    setName("");
    setAddress("");
    setPhone("");
    setIsActive(true);
    setLogo(null);
    setLogoPreview(null);
    setChapaPublicKey("");
    setChapaSecretKey("");
    setErrorMsg("");
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaving(true);

    try {
      const logoFileId = await uploadLogo(logo);
      await createOne(RESOURCE, {
        businessName: name,
        address,
        phone,
        isActive,
        logoFileId,
        ...(chapaPublicKey ? { chapaPublicKey } : {}),
        ...(chapaSecretKey ? { chapaSecretKey } : {}),
      });

      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create business");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (b: ApiBusiness) => {
    setEditing(b);
    setEditName(b.businessName);
    setEditAddress(b.address);
    setEditPhone(b.phone);
    setEditIsActive(b.isActive);
    setEditLogo(null);
    setEditLogoPreview(null);
    setEditChapaPublicKey(b.chapaPublicKey || "");
    setEditChapaSecretKey(b.chapaSecretKey || "");
    setEditError("");
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError("");
    setEditingSaving(true);

    try {
      const logoFileId = await uploadLogo(editLogo);
      await updateOne(RESOURCE, editing.id, {
        businessName: editName,
        address: editAddress,
        phone: editPhone,
        isActive: editIsActive,
        ...(logoFileId ? { logoFileId } : {}),
        ...(editChapaPublicKey ? { chapaPublicKey: editChapaPublicKey } : {}),
        ...(editChapaSecretKey ? { chapaSecretKey: editChapaSecretKey } : {}),
      });

      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || "Failed to update business");
    } finally {
      setEditingSaving(false);
    }
  };

  const toggleActive = async (b: ApiBusiness) => {
    try {
      await updateOne(RESOURCE, b.id, { isActive: !b.isActive });
    } catch (err: any) {
      alert(err?.message || "Failed to toggle status");
    }
  };

  const removeBusiness = async (id: string) => {
    if (!confirm("Delete this business?")) return;
    try {
      await deleteOne(RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || "Failed to delete business");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-bold">Manage Businesses</h3>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search businesses"
            className="px-4 py-2 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
          />
          <Button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> Register Business
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-zinc-200"
            >
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-500">Failed to load businesses</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paged.map((b) => (
          <div
            key={b.id}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  {b.logoFile?.url ? (
                    <img
                      src={buildUrl(b.logoFile.url)}
                      className="w-full h-full object-cover"
                      alt="logo"
                    />
                  ) : (
                    <Store size={24} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{b.businessName}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                    >
                      {b.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">{b.address}</p>
                  <p className="text-xs text-zinc-400">{b.phone}</p>
                  {b.logoFileId && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Logo File ID: {b.logoFileId}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleActive(b)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${b.isActive ? "bg-emerald-500" : "bg-zinc-200"}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${b.isActive ? "right-1" : "left-1"}`}
                  />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-zinc-400 hover:text-black"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => removeBusiness(b.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </Button>
        <div className="text-xs text-zinc-500">Page {page + 1}</div>
        <Button
          variant="secondary"
          onClick={() => setPage((p) => p + 1)}
          disabled={(page + 1) * limit >= businesses.length}
        >
          Next
        </Button>
      </div>

      <Drawer
        open={open}
        title="Register Business"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Business Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Active Status
            </label>
            <select
              value={isActive ? "true" : "false"}
              onChange={(e) => setIsActive(e.target.value === "true")}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            >
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Logo
            </label>
            <label className="group block border-2 border-dashed border-burger-black/10 rounded-2xl p-4 cursor-pointer hover:border-burger-orange transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setLogo(f);
                  setLogoPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                  ) : (
                    <Store size={22} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">Choose logo</p>
                  <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Chapa Public Key
            </label>
            <input
              value={chapaPublicKey}
              onChange={(e) => setChapaPublicKey(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Chapa Secret Key
            </label>
            <input
              value={chapaSecretKey}
              onChange={(e) => setChapaSecretKey(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>

          {errorMsg && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Business"}
          </Button>
        </form>
      </Drawer>

      <Drawer
        open={editOpen}
        title="Edit Business"
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Business Name
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Address
            </label>
            <input
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Phone
            </label>
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Active Status
            </label>
            <select
              value={editIsActive ? "true" : "false"}
              onChange={(e) => setEditIsActive(e.target.value === "true")}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            >
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Logo
            </label>
            <label className="group block border-2 border-dashed border-burger-black/10 rounded-2xl p-4 cursor-pointer hover:border-burger-orange transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setEditLogo(f);
                  setEditLogoPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                  {editLogoPreview ? (
                    <img
                      src={editLogoPreview}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                  ) : (
                    <Store size={22} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">Choose logo</p>
                  <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Chapa Public Key
            </label>
            <input
              value={editChapaPublicKey}
              onChange={(e) => setEditChapaPublicKey(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">
              Chapa Secret Key
            </label>
            <input
              value={editChapaSecretKey}
              onChange={(e) => setEditChapaSecretKey(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            />
          </div>

          {editError && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
              {editError}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            disabled={editingSaving}
          >
            {editingSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
