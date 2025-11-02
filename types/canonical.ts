/**
 * Tipos Canônicos - Biblioteca de Tipos Reutilizáveis
 * FASE I2: Sistema de Tipos Canônicos
 *
 * Centraliza tipos comuns usados em todo o projeto
 * para garantir consistência e facilitar manutenção.
 */

// ========== FORMULÁRIOS & VALIDAÇÃO ==========

/**
 * Erros de validação padronizados
 */
export type ValidationErrors = Record<string, string | undefined>;

/**
 * Estado de formulário
 */
export type FormState<T = Record<string, any>> = {
  data: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isValid: boolean;
};

/**
 * Handler de evento de formulário
 */
export type FormEventHandler<T = Event> = (event: T) => void;

// ========== API & RESPOSTAS ==========

/**
 * Resposta de API genérica
 */
export type ApiResponse<T = unknown> = {
  data: T;
  error?: string;
  success: boolean;
  message?: string;
};

/**
 * Resposta paginada
 */
export type PaginatedResponse<T = unknown> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}>;

/**
 * Resultado assíncrono (similar ao Result do Rust)
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Resultado síncrono
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// ========== EVENTOS & INTERAÇÕES ==========

/**
 * Handler de evento genérico
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * Handler de evento de mouse
 */
export type MouseEventHandler = EventHandler<MouseEvent>;

/**
 * Handler de evento de teclado
 */
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;

/**
 * Handler de mudança de input
 */
export type ChangeEventHandler = EventHandler<Event>;

// ========== COMPONENTES & UI ==========

/**
 * Props básicas de componente
 */
export type BaseComponentProps = {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
};

/**
 * Variant de componente
 */
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Tamanho de componente
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ========== CONFIGURAÇÕES & SETTINGS ==========

/**
 * Configuração de API
 */
export type ApiConfig = {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
};

/**
 * Configuração de cache
 */
export type CacheConfig = {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
};

// ========== NAVEGAÇÃO & ROUTING ==========

/**
 * Item de navegação
 */
export type NavigationItem = {
  label: string;
  href: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
  isActive?: boolean;
  requiresAuth?: boolean;
};

/**
 * Estado de navegação
 */
export type NavigationState = {
  currentPath: string;
  history: string[];
  canGoBack: boolean;
  canGoForward: boolean;
};

// ========== AUTENTICAÇÃO & AUTORIZAÇÃO ==========

/**
 * Dados do usuário autenticado
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
};

/**
 * Papel do usuário
 */
export type UserRole = 'admin' | 'user' | 'moderator' | 'guest';

/**
 * Permissão específica
 */
export type Permission = string;

// ========== NOTIFICAÇÕES & FEEDBACK ==========

/**
 * Tipo de notificação
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notificação
 */
export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
};

// ========== ARQUIVOS & UPLOAD ==========

/**
 * Arquivo para upload
 */
export type UploadFile = {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
};

/**
 * Configuração de upload
 */
export type UploadConfig = {
  maxSize: number;
  allowedTypes: string[];
  maxFiles: number;
  autoUpload: boolean;
};

// ========== PAGINAÇÃO & FILTROS ==========

/**
 * Parâmetros de paginação
 */
export type PaginationParams = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * Filtros genéricos
 */
export type Filters<T = Record<string, any>> = {
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
} & T;

// ========== TEMAS & STYLING ==========

/**
 * Tema da aplicação
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Configuração de tema
 */
export type ThemeConfig = {
  mode: Theme;
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontSize: 'sm' | 'md' | 'lg';
};

// ========== UTILITÁRIOS ==========

/**
 * Status de carregamento
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Estado assíncrono
 */
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Opções de select/dropdown
 */
export type SelectOption<T = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ComponentType;
};

/**
 * Coordenadas geográficas
 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Intervalo de datas
 */
export type DateRange = {
  start: Date;
  end: Date;
};

// ========== EXPORTS PARA FACILITAR IMPORTAÇÃO ==========

export type {
  ValidationErrors as FormErrors,
  ApiResponse as APIResponse,
  EventHandler as EventCallback,
  ComponentVariant as Variant,
  ComponentSize as Size,
  AuthUser as User,
  NotificationType as AlertType,
  LoadingState as LoadState,
  AsyncState as RemoteData,
};
