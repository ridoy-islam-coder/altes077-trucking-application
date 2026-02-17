import { z } from 'zod';

// Image validation
export const imageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  url: z.string().url('Invalid image URL'),
});

// Location validation
export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

// Driver create validation
export const driverCreateSchema = z.object({
  vehicleType: z.enum([
    'Truck',
    'Van',
    'Trailer',
    'Flatbed',
    'Refrigerated',
    'Tanker',
    'Container',
    'Other',
  ]),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  vehicleCapacity: z.string().min(1, 'Vehicle capacity is required'),
  vehicleColor: z.string().min(1, 'Vehicle color is required'),
  status: z.enum(['active', 'inactive']).optional(),
  image: imageSchema.optional(),
  location: locationSchema.optional(),
});

// TypeScript type
export type DriverCreateInput = z.infer<typeof driverCreateSchema>;




export const driverCreateBasicSchema = z.object({
  vehicleType: z.enum([
    'Truck',
    'Van',
    'Trailer',
    'Flatbed',
    'Refrigerated',
    'Tanker',
    'Container',
    'Other',
  ]),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  vehicleCapacity: z.string().min(1, 'Vehicle capacity is required'),
  vehicleColor: z.string().min(1, 'Vehicle color is required'),
  status: z.enum(['active', 'inactive']).optional(),
});

// **export the type**
export type DriverCreateBasicInput = z.infer<typeof driverCreateBasicSchema>;