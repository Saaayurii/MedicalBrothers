export type Notification = {
  id: string;
  type: 'appointment' | 'reminder' | 'emergency' | 'message';
  title: string;
  message: string;
  userId: number;
  userRole: 'patient' | 'doctor' | 'admin';
  data?: Record<string, any>;
  timestamp: Date;
};
