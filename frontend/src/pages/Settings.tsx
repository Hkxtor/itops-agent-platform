import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Bell, Database, Shield, Loader2, CheckCircle2, AlertCircle, Sun, Moon, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('api');
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const { user, login, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // 密码修改状态
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState('');
  
  // API密钥本地状态
  const [doubaoApiKey, setDoubaoApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [doubaoModel, setDoubaoModel] = useState('');
  const [openaiModel, setOpenaiModel] = useState('');
  const [doubaoApiBase, setDoubaoApiBase] = useState('');
  const [openaiApiBase, setOpenaiApiBase] = useState('');
  const [localAiModel, setLocalAiModel] = useState('qwen2.5:7b');
  const [localAiApiBase, setLocalAiApiBase] = useState('http://host.docker.internal:11434/v1');
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // 通知配置本地状态
  const [notificationConfig, setNotificationConfig] = useState({
    webhook_enabled: true,
    email_enabled: false,
    wechat_enabled: false,
    dingtalk_enabled: false,
    email_config: {},
    wechat_config: {},
    dingtalk_config: {},
    alert_notification: {
      critical: true,
      warning: true,
      info: false
    },
    task_notification: {
      success: true,
      failed: true,
      running: false
    }
  });
  const [notificationSaveStatus, setNotificationSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 如果是强制修改密码，自动切换到安全设置标签
  useEffect(() => {
    if (searchParams.get('changePassword') === 'true') {
      setActiveTab('security');
    }
  }, [searchParams]);

  // 密码修改处理
  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordStatus('saving');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('密码长度至少8位');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
      return;
    }
    
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        setPasswordStatus('saved');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        if (user) {
          const updatedUser = { ...user, passwordMustChange: false };
          updateUser(updatedUser);
        }
        
        // 清除 URL 中的 changePassword 参数
        navigate('/settings', { replace: true });
        
        setTimeout(() => setPasswordStatus('idle'), 3000);
      } else {
        setPasswordError(response.data.message || '密码修改失败');
        setPasswordStatus('error');
        setTimeout(() => setPasswordStatus('idle'), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || '密码修改失败');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    }
  };

  const { data: apiKeyStatus } = useQuery({
    queryKey: ['apiKeyStatus'],
    queryFn: async () => {
      const res = await api.get('/api/settings/api-keys');
      if (res.data.data?.doubao?.masked) {
        setDoubaoApiKey('masked');
      }
      if (res.data.data?.openai?.masked) {
        setOpenaiApiKey('masked');
      }
      if (res.data.data?.doubao?.model) {
        setDoubaoModel(res.data.data.doubao.model);
      }
      if (res.data.data?.openai?.model) {
        setOpenaiModel(res.data.data.openai.model);
      }
      if (res.data.data?.doubao?.apiBase) {
        setDoubaoApiBase(res.data.data.doubao.apiBase);
      }
      if (res.data.data?.openai?.apiBase) {
        setOpenaiApiBase(res.data.data.openai.apiBase);
      }
      if (res.data.data?.localAi?.model) {
        setLocalAiModel(res.data.data.localAi.model);
      }
      if (res.data.data?.localAi?.apiBase) {
        setLocalAiApiBase(res.data.data.localAi.apiBase);
      }
      return res.data.data;
    },
  });

  const apiKeysMutation = useMutation({
    mutationFn: async ({ 
      doubaoApiKey, openaiApiKey, doubaoModel, openaiModel, doubaoApiBase, openaiApiBase, localAiModel, localAiApiBase
    }: { 
      doubaoApiKey?: string; openaiApiKey?: string; doubaoModel?: string; openaiModel?: string;
      doubaoApiBase?: string; openaiApiBase?: string;
      localAiModel?: string; localAiApiBase?: string;
    }) => {
      const res = await api.put('/api/settings/api-keys', { 
        doubaoApiKey, openaiApiKey, doubaoModel, openaiModel, doubaoApiBase, openaiApiBase, localAiModel, localAiApiBase
      });
      return res.data;
    },
    onMutate: () => {
      setApiKeySaveStatus('saving');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeyStatus'] });
      setApiKeySaveStatus('saved');
      setTimeout(() => setApiKeySaveStatus('idle'), 2000);
    },
    onError: () => {
      setApiKeySaveStatus('error');
      setTimeout(() => setApiKeySaveStatus('idle'), 3000);
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (provider: 'doubao' | 'openai' | 'local') => {
      const res = await api.delete(`/api/settings/api-keys/${provider}`);
      return res.data;
    },
    onSuccess: (_data, provider) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeyStatus'] });
      // 重置对应提供商的本地状态
      if (provider === 'doubao') {
        setDoubaoApiKey('');
        setDoubaoModel('');
        setDoubaoApiBase('');
      }
      if (provider === 'openai') {
        setOpenaiApiKey('');
        setOpenaiModel('');
        setOpenaiApiBase('');
      }
      if (provider === 'local') {
        setLocalAiModel('qwen2.5:7b');
        setLocalAiApiBase('http://host.docker.internal:11434/v1');
      }
    },
  });

  useQuery({
    queryKey: ['notificationConfig'],
    queryFn: async () => {
      const res = await api.get('/api/notification-config');
      if (res.data.data) {
        setNotificationConfig(res.data.data);
      }
      return res.data.data;
    },
  });

  const notificationConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const res = await api.put('/api/notification-config', config);
      return res.data;
    },
    onMutate: () => {
      setNotificationSaveStatus('saving');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfig'] });
      setNotificationSaveStatus('saved');
      setTimeout(() => setNotificationSaveStatus('idle'), 2000);
    },
    onError: () => {
      setNotificationSaveStatus('error');
      setTimeout(() => setNotificationSaveStatus('idle'), 3000);
    },
  });

  const handleSaveApiKeys = () => {
    const payload: any = {};
    if (doubaoApiKey !== 'masked') {
      payload.doubaoApiKey = doubaoApiKey;
    }
    if (openaiApiKey !== 'masked') {
      payload.openaiApiKey = openaiApiKey;
    }
    payload.doubaoModel = doubaoModel;
    payload.openaiModel = openaiModel;
    payload.doubaoApiBase = doubaoApiBase;
    payload.openaiApiBase = openaiApiBase;
    payload.localAiModel = localAiModel;
    payload.localAiApiBase = localAiApiBase;
    
    apiKeysMutation.mutate(payload);
  };

  const tabs = [
    { id: 'api', name: 'API配置', icon: Key },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'database', name: '数据库', icon: Database },
    { id: 'security', name: '安全设置', icon: Shield },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">设置</h1>
          <p className="text-text-secondary">配置系统参数和API密钥</p>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-border p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-background'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 p-6">
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      API密钥配置
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">
                      配置AI服务的API密钥。所有密钥仅存储在后端，不暴露到前端。
                    </p>
                  </div>

                  {/* 已配置模型列表 */}
                  {(apiKeyStatus?.doubao?.configured || apiKeyStatus?.openai?.configured || apiKeyStatus?.localAi?.configured) && (
                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-3">已配置的模型</h4>
                      <div className="space-y-2">
                        {apiKeyStatus?.doubao?.configured && (
                          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-text-primary">豆包 ({apiKeyStatus.doubao.model})</p>
                              <p className="text-xs text-text-secondary">密钥: {apiKeyStatus.doubao.masked}</p>
                            </div>
                            <button
                              onClick={() => deleteModelMutation.mutate('doubao')}
                              disabled={deleteModelMutation.isPending}
                              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-all"
                            >
                              {deleteModelMutation.isPending ? '删除中...' : '删除'}
                            </button>
                          </div>
                        )}
                        {apiKeyStatus?.openai?.configured && (
                          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-text-primary">OpenAI ({apiKeyStatus.openai.model})</p>
                              <p className="text-xs text-text-secondary">密钥: {apiKeyStatus.openai.masked}</p>
                            </div>
                            <button
                              onClick={() => deleteModelMutation.mutate('openai')}
                              disabled={deleteModelMutation.isPending}
                              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-all"
                            >
                              {deleteModelMutation.isPending ? '删除中...' : '删除'}
                            </button>
                          </div>
                        )}
                        {apiKeyStatus?.localAi?.configured && (
                          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-text-primary">本地 AI ({apiKeyStatus.localAi.model})</p>
                              <p className="text-xs text-text-secondary">地址: {apiKeyStatus.localAi.apiBase}</p>
                            </div>
                            <button
                              onClick={() => deleteModelMutation.mutate('local')}
                              disabled={deleteModelMutation.isPending}
                              className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-all"
                            >
                              {deleteModelMutation.isPending ? '删除中...' : '删除'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-primary">豆包 API</h4>
                        <span
                          className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            apiKeyStatus?.doubao?.configured
                              ? 'bg-status-success/10 text-status-success'
                              : 'bg-status-failed/10 text-status-failed'
                          )}
                        >
                          {apiKeyStatus?.doubao?.configured ? '已配置' : '未配置'}
                        </span>
                      </div>
                      {apiKeyStatus?.doubao?.configured && doubaoApiKey === 'masked' && (
                        <p className="text-sm text-text-secondary mb-3">
                          当前密钥: {apiKeyStatus.doubao.masked}
                        </p>
                      )}
                      <input
                        type="password"
                        placeholder="输入豆包 API 密钥"
                        value={doubaoApiKey === 'masked' ? '' : doubaoApiKey}
                        onChange={(e) => setDoubaoApiKey(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <input
                        type="text"
                        placeholder="输入模型 ID (默认: doubao-4o)"
                        value={doubaoModel}
                        onChange={(e) => setDoubaoModel(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <input
                        type="text"
                        placeholder="输入 API 地址 (默认: https://ark.cn-beijing.volces.com/api/v3)"
                        value={doubaoApiBase}
                        onChange={(e) => setDoubaoApiBase(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <p className="text-xs text-text-secondary">
                        输入您的豆包 API 密钥、模型 ID 和 API 地址
                      </p>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-primary">OpenAI API</h4>
                        <span
                          className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            apiKeyStatus?.openai?.configured
                              ? 'bg-status-success/10 text-status-success'
                              : 'bg-status-failed/10 text-status-failed'
                          )}
                        >
                          {apiKeyStatus?.openai?.configured ? '已配置' : '未配置'}
                        </span>
                      </div>
                      {apiKeyStatus?.openai?.configured && openaiApiKey === 'masked' && (
                        <p className="text-sm text-text-secondary mb-3">
                          当前密钥: {apiKeyStatus.openai.masked}
                        </p>
                      )}
                      <input
                        type="password"
                        placeholder="输入 OpenAI API 密钥"
                        value={openaiApiKey === 'masked' ? '' : openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <input
                        type="text"
                        placeholder="输入模型 ID (默认: gpt-4o)"
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <input
                        type="text"
                        placeholder="输入 API 地址 (默认: https://api.openai.com/v1)"
                        value={openaiApiBase}
                        onChange={(e) => setOpenaiApiBase(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <p className="text-xs text-text-secondary">
                        输入您的 OpenAI API 密钥、模型 ID 和 API 地址
                      </p>
                    </div>

                    {/* 本地 AI 大模型配置 */}
                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-primary">本地 AI 大模型</h4>
                        <span
                          className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            apiKeyStatus?.localAi?.configured
                              ? 'bg-status-success/10 text-status-success'
                              : 'bg-status-failed/10 text-status-failed'
                          )}
                        >
                          {apiKeyStatus?.localAi?.configured ? '已配置' : '未配置'}
                        </span>
                      </div>
                      {apiKeyStatus?.localAi?.configured && (
                        <p className="text-sm text-text-secondary mb-3">
                          当前地址: {apiKeyStatus.localAi.apiBase}
                        </p>
                      )}
                      <select
                        value={localAiModel}
                        onChange={(e) => setLocalAiModel(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      >
                        <option value="qwen2.5:7b">Qwen 2.5 7B</option>
                        <option value="qwen2.5:14b">Qwen 2.5 14B</option>
                        <option value="llama3.1:8b">Llama 3.1 8B</option>
                        <option value="llama3.1:70b">Llama 3.1 70B</option>
                        <option value="mistral:7b">Mistral 7B</option>
                        <option value="deepseek-coder:6.7b">DeepSeek Coder 6.7B</option>
                        <option value="gemma2:9b">Gemma 2 9B</option>
                        <option value="phi3:3.8b">Phi 3 3.8B</option>
                      </select>
                      <input
                        type="text"
                        placeholder="输入本地 AI API 地址 (默认: http://host.docker.internal:11434/v1)"
                        value={localAiApiBase}
                        onChange={(e) => setLocalAiApiBase(e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary mb-3"
                      />
                      <p className="text-xs text-text-secondary">
                        支持 Ollama、LM Studio、vLLM 等 OpenAI 兼容 API。本地模型无需 API Key。
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {apiKeySaveStatus === 'saving' && (
                          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                        )}
                        {apiKeySaveStatus === 'saved' && (
                          <p className="text-xs text-status-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            已保存
                          </p>
                        )}
                        {apiKeySaveStatus === 'error' && (
                          <p className="text-xs text-status-failed flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            保存失败
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleSaveApiKeys}
                        disabled={apiKeySaveStatus === 'saving'}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {apiKeySaveStatus === 'saving' && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        保存配置
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      通知设置
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">
                      配置告警通知和任务状态通知的方式
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-4">通知渠道</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">Webhook</p>
                            <p className="text-xs text-text-secondary">通过外部Webhook接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.webhook_enabled}
                              onChange={(e) => setNotificationConfig({...notificationConfig, webhook_enabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">邮件</p>
                            <p className="text-xs text-text-secondary">通过邮件接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.email_enabled}
                              onChange={(e) => setNotificationConfig({...notificationConfig, email_enabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">企业微信</p>
                            <p className="text-xs text-text-secondary">通过企业微信接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.wechat_enabled}
                              onChange={(e) => setNotificationConfig({...notificationConfig, wechat_enabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">钉钉</p>
                            <p className="text-xs text-text-secondary">通过钉钉接收通知</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.dingtalk_enabled}
                              onChange={(e) => setNotificationConfig({...notificationConfig, dingtalk_enabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-4">告警通知</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">严重告警</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.alert_notification.critical}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                alert_notification: {...notificationConfig.alert_notification, critical: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">警告告警</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.alert_notification.warning}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                alert_notification: {...notificationConfig.alert_notification, warning: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">信息通知</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.alert_notification.info}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                alert_notification: {...notificationConfig.alert_notification, info: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-4">任务通知</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">任务成功</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.task_notification.success}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                task_notification: {...notificationConfig.task_notification, success: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">任务失败</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.task_notification.failed}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                task_notification: {...notificationConfig.task_notification, failed: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-text-secondary">任务运行中</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationConfig.task_notification.running}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                task_notification: {...notificationConfig.task_notification, running: e.target.checked}
                              })}
                            />
                            <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {notificationSaveStatus === 'saving' && (
                          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                        )}
                        {notificationSaveStatus === 'saved' && (
                          <p className="text-xs text-status-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            已保存
                          </p>
                        )}
                        {notificationSaveStatus === 'error' && (
                          <p className="text-xs text-status-failed flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            保存失败
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => notificationConfigMutation.mutate(notificationConfig)}
                        disabled={notificationSaveStatus === 'saving'}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {notificationSaveStatus === 'saving' && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        保存通知配置
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'database' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      数据库设置
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">
                      数据库配置和备份设置
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-2">数据库类型</h4>
                      <p className="text-sm text-text-secondary">SQLite (当前)</p>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-2">数据路径</h4>
                      <p className="text-sm text-text-secondary">./data/app.db</p>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-2">数据备份</h4>
                      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
                        创建备份
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      安全设置
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">
                      配置安全策略和访问控制
                    </p>
                  </div>

                  {/* 修改密码 */}
                  <div className="bg-background rounded-lg p-6">
                    <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      修改密码
                    </h4>
                    {searchParams.get('changePassword') === 'true' && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2 text-yellow-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">首次登录需要修改密码</p>
                          <p className="text-xs mt-1">为了您的账户安全，请修改默认密码后继续使用</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">当前密码</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="请输入当前密码"
                          className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">新密码</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="请输入新密码（至少8位）"
                          className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">确认新密码</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="请再次输入新密码"
                          className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                      {passwordError && (
                        <p className="text-sm text-status-failed flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {passwordError}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {passwordStatus === 'saving' && (
                          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                        )}
                        {passwordStatus === 'saved' && (
                          <p className="text-sm text-status-success flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            密码修改成功
                          </p>
                        )}
                        <button
                          onClick={handlePasswordChange}
                          disabled={passwordStatus === 'saving'}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {passwordStatus === 'saving' && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          修改密码
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div>
                        <h4 className="font-medium text-text-primary">主题设置</h4>
                        <p className="text-sm text-text-secondary">
                          选择深色或浅色主题
                        </p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
                      >
                        {theme === 'dark' ? (
                          <Moon className="w-5 h-5" />
                        ) : (
                          <Sun className="w-5 h-5" />
                        )}
                        <span className="text-sm text-text-primary">
                          {theme === 'dark' ? '深色主题' : '浅色主题'}
                        </span>
                      </button>
                    </div>

                    <div className="bg-background rounded-lg p-4">
                      <h4 className="font-medium text-text-primary mb-2">CORS配置</h4>
                      <p className="text-sm text-text-secondary mb-3">
                        允许的前端域名
                      </p>
                      <input
                        type="text"
                        defaultValue="http://localhost:3000"
                        className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 微信公众号二维码 */}
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-4">关注我们</h3>
          <p className="text-sm text-text-secondary mb-4">扫码关注微信公众号，获取更多运维资讯</p>
          <div className="flex justify-center">
            <img
              src="/wechaterweima.png"
              alt="微信公众号二维码"
              className="max-w-full h-auto rounded-lg border border-border"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
