import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Upload, Save, 
  Loader2, Navigation, AlertCircle 
} from 'lucide-react';
import InputField from '../components/ui/InputField';
import { Client, ClientFormData } from '../types';
import { getClientById, saveClient, fileToBase64, generateUUID } from '../utils/storage';

const ClientForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<ClientFormData>({
    mode: 'onBlur',
    defaultValues: {
      gender: undefined 
    }
  });

  const { onChange: fileRegisterOnChange, ...fileRegisterRest } = register('file');

  useEffect(() => {
    if (editId) {
      const client = getClientById(editId);
      if (client) {
        setValue('fullName', client.fullName);
        setValue('email', client.email);
        setValue('phone', client.phone);
        setValue('address', client.address);
        setValue('gender', client.gender);
        setValue('dob', client.dob);
        if (client.avatar) {
          setPreviewAvatar(client.avatar);
        }
      }
    }
  }, [editId, setValue]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    
    // Request high accuracy from the browser
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Using the exact API key provided
        const apiKey = "4b3ead988877464c97ca8591303d83ee";

        try {
          // Call Geoapify Reverse Geocoding API
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=en&limit=1&apiKey=${apiKey}`
          );

          if (!response.ok) {
            throw new Error(`Geoapify API Error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          if (data && data.features && data.features.length > 0) {
            // 'formatted' usually contains the full, proper address (Street, City, Zip, Country)
            const properties = data.features[0].properties;
            const formattedAddress = properties.formatted;
            
            setValue('address', formattedAddress, { shouldValidate: true });
          } else {
            throw new Error("Address not found for these coordinates.");
          }

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error("Location Fetch Error:", errMsg);
          alert("Failed to retrieve address. Please check your network connection.");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        // Detailed error logging to avoid [object Object]
        console.error("Geolocation Error Details:", {
          code: error.code,
          message: error.message
        });
        
        setIsLoadingLocation(false);
        
        let msg = "Could not retrieve location.";
        // Error codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        switch (error.code) {
          case 1:
            msg = "Location permission denied. Please allow access in your browser settings.";
            break;
          case 2:
            msg = "Location unavailable. Please check your GPS or network connection.";
            break;
          case 3:
            msg = "Location request timed out.";
            break;
          default:
            msg = `Location error: ${error.message}`;
        }
        
        alert(msg);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 0 
      }
    );
  };

  const onSubmit: SubmitHandler<ClientFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      let avatarBase64 = previewAvatar;
      if (data.file && data.file.length > 0) {
        const file = data.file[0];
        if (file.size > 2 * 1024 * 1024) {
          alert("Image too large (max 2MB).");
          setIsSubmitting(false);
          return;
        }
        avatarBase64 = await fileToBase64(file);
      }

      const clientData: Client = {
        id: editId || generateUUID(),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        gender: data.gender,
        dob: data.dob,
        avatar: avatarBase64 || undefined,
        createdAt: editId ? (getClientById(editId)?.createdAt || Date.now()) : Date.now(),
      };

      saveClient(clientData);
      setTimeout(() => navigate('/table'), 500);
    } catch (error) {
      console.error(error);
      alert("Error saving data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    fileRegisterOnChange(e);
    if (e.target.files?.[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setPreviewAvatar(base64);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editId ? 'Edit Client' : 'New Client Registration'}
            </h2>
            <p className="text-primary-100 text-sm mt-1">
              Please fill in the information below
            </p>
          </div>
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <ClipboardListIcon className="text-white w-6 h-6" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              placeholder="e.g. John Doe"
              icon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              registration={register('fullName', { 
                required: 'Full name is required',
                minLength: { value: 2, message: 'Must be at least 2 characters' }
              })}
            />

            <InputField
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              registration={register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Invalid email address'
                }
              })}
            />

            <InputField
              label="Phone Number"
              type="tel"
              placeholder="1234567890"
              icon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              registration={register('phone', { 
                required: 'Phone number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
              })}
            />

            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-slate-700 ml-1">Date of Birth</label>
              <div className="relative group">
                <input
                  type="date"
                  {...register('dob', { required: 'Date of birth is required' })}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all pl-10 ${
                    errors.dob ? 'border-red-300' : 'border-slate-200 focus:border-primary-500'
                  }`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              {errors.dob && <span className="text-xs text-red-500 ml-1 mt-1 font-medium">{errors.dob.message}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-slate-700 ml-1">Address</label>
            <div className="flex gap-2 items-start">
              <div className="relative flex-1 group">
                <textarea
                  placeholder="Address will auto-fill here..."
                  {...register('address', { required: 'Address is required' })}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all pl-10 resize-none ${
                    errors.address ? 'border-red-300' : 'border-slate-200 focus:border-primary-500'
                  }`}
                />
                <div className="absolute left-3 top-4 text-slate-400 group-focus-within:text-primary-500">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <button
                type="button"
                onClick={fetchLocation}
                disabled={isLoadingLocation}
                className="flex items-center justify-center h-[46px] w-[46px] flex-shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 border border-slate-200"
                title="Get current location"
              >
                {isLoadingLocation ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : <Navigation className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {errors.address && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5 mt-1 text-red-500 text-xs font-medium ml-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.address.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-slate-700 ml-1">Gender</label>
              <select
                {...register('gender', { required: 'Please select a gender' })}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none ${
                   errors.gender ? 'border-red-300' : 'border-slate-200 focus:border-primary-500'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <span className="text-xs text-red-500 ml-1 mt-1 font-medium">{errors.gender.message}</span>}
            </div>

            <div className="flex flex-col gap-1 w-full">
               <label className="text-sm font-medium text-slate-700 ml-1">Profile Photo (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                   {previewAvatar ? (
                     <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                   )}
                </div>
                <label className="flex-1 cursor-pointer group">
                  <div className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-all">
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="text-sm">Choose File</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" {...fileRegisterRest} onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {editId ? 'Update Client' : 'Submit Registration'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

export default ClientForm;