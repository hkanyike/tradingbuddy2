"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Settings, Shield, Database, Bell, Activity } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Platform Settings
    maintenanceMode: false,
    registrationEnabled: true,
    inviteOnlyMode: true,
    
    // Trading Settings
    globalTradingEnabled: true,
    maxPositionSize: "100000",
    maxDailyLoss: "5000",
    circuitBreakerThreshold: "10000",
    
    // Risk Limits
    maxLeverage: "2",
    maxDeltaExposure: "500",
    maxGammaExposure: "100",
    
    // Alert Settings
    criticalAlertsEnabled: true,
    emailAlertsEnabled: true,
    slackIntegrationEnabled: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Settings saved successfully");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-sm text-muted-foreground">
            Platform-wide configuration and feature flags
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Platform Settings</CardTitle>
          </div>
          <CardDescription>Control platform access and availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable all trading and show maintenance message
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Registration Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register accounts
              </p>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, registrationEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Invite-Only Mode</Label>
              <p className="text-sm text-muted-foreground">
                Require invite code for registration
              </p>
            </div>
            <Switch
              checked={settings.inviteOnlyMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, inviteOnlyMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Trading Settings</CardTitle>
          </div>
          <CardDescription>Global trading controls and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Global Trading Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all trading activity
              </p>
            </div>
            <Switch
              checked={settings.globalTradingEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, globalTradingEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPositionSize">Max Position Size ($)</Label>
              <Input
                id="maxPositionSize"
                type="number"
                value={settings.maxPositionSize}
                onChange={(e) =>
                  setSettings({ ...settings, maxPositionSize: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
              <Input
                id="maxDailyLoss"
                type="number"
                value={settings.maxDailyLoss}
                onChange={(e) =>
                  setSettings({ ...settings, maxDailyLoss: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="circuitBreakerThreshold">Circuit Breaker Threshold ($)</Label>
            <Input
              id="circuitBreakerThreshold"
              type="number"
              value={settings.circuitBreakerThreshold}
              onChange={(e) =>
                setSettings({ ...settings, circuitBreakerThreshold: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Halt all trading if system-wide losses exceed this amount
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Risk Limits</CardTitle>
          </div>
          <CardDescription>System-wide risk exposure controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxLeverage">Max Leverage</Label>
              <Input
                id="maxLeverage"
                type="number"
                step="0.1"
                value={settings.maxLeverage}
                onChange={(e) =>
                  setSettings({ ...settings, maxLeverage: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDeltaExposure">Max Delta Exposure</Label>
              <Input
                id="maxDeltaExposure"
                type="number"
                value={settings.maxDeltaExposure}
                onChange={(e) =>
                  setSettings({ ...settings, maxDeltaExposure: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGammaExposure">Max Gamma Exposure</Label>
              <Input
                id="maxGammaExposure"
                type="number"
                value={settings.maxGammaExposure}
                onChange={(e) =>
                  setSettings({ ...settings, maxGammaExposure: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Alert Settings</CardTitle>
          </div>
          <CardDescription>Configure system alert notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Critical Alerts Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Show critical system alerts to admins
              </p>
            </div>
            <Switch
              checked={settings.criticalAlertsEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, criticalAlertsEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Alerts Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for critical events
              </p>
            </div>
            <Switch
              checked={settings.emailAlertsEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailAlertsEnabled: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Slack Integration</Label>
              <p className="text-sm text-muted-foreground">
                Post alerts to Slack workspace
              </p>
            </div>
            <Switch
              checked={settings.slackIntegrationEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, slackIntegrationEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
