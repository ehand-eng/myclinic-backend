import React, { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import CustomRoleAssignment from '@/components/admin/CustomRoleAssignment';
import RoleAssignment from '@/components/admin/RoleAssignment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CustomRoleManagement = () => {
  const [activeTab, setActiveTab] = useState("assign-roles");

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold medical-text-gradient">Role Management</h1>
            <p className="text-medicalGray-600 mt-2">
              Manage users, roles, and permissions in the system
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
              <TabsTrigger value="assign-roles">Assign Roles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage-users" className="space-y-4">
              <CustomRoleAssignment />
            </TabsContent>
            
            <TabsContent value="assign-roles" className="space-y-4">
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle>Role Assignment Management</CardTitle>
                  <CardDescription>
                    View and manage existing user-role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleAssignment />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default CustomRoleManagement;