# PantrySmart App - Setup Guide

## Estructura del Proyecto

```
pantrysmart_app/
├── api/              # Backend FastAPI
├── mobile/           # Frontend React Native + Expo
├── docker-compose.yml
├── Makefile
└── .env
```

## Requisitos Previos

- Docker y Docker Compose
- Expo Go app en tu teléfono (iOS/Android)

## Setup Inicial

1. **Crear archivo .env** (copia de .env.mobile.example):
```bash
cp .env.mobile.example .env
```

2. **Agregar variables necesarias al .env**:
```env
# Database
MYSQL_DATABASE=pantrysmart
MYSQL_USER=pantry_user
MYSQL_PASSWORD=pantry_password
MYSQL_ROOT_PASSWORD=root_password
DATABASE_URL=mysql+pymysql://pantry_user:pantry_password@db:3306/pantrysmart

# Ports
API_PORT=8000
DB_PORT=3306
ADMINER_PORT=8080

# Mobile
MOBILE_PORT=8081
MOBILE_HOST=0.0.0.0
EXPO_PORT=19000
EXPO_PORT_1=19001
EXPO_PORT_2=19002
```

## Comandos Disponibles

### Levantar todo el stack
```bash
make up          # Levanta API + DB + Mobile
make upd         # En segundo plano
```

### Comandos específicos
```bash
# Solo API + DB
make api-up

# Solo Mobile
make mobile-up

# Solo DB
make db-up
```

### Logs y debugging
```bash
make logs        # Todos los servicios
make api-logs    # Solo API
make mobile-logs # Solo Mobile
make db-logs     # Solo DB
```

### Acceso a contenedores
```bash
make api-bash    # Bash en API
make mobile-bash # Shell en Mobile
```

## Conectar desde tu teléfono

1. **Instalar Expo Go** en tu teléfono
2. **Asegúrate de estar en la misma red WiFi** que tu computadora
3. **Levantar el stack**:
   ```bash
   make up
   ```
4. **Obtener la IP de tu computadora**:
   ```bash
   # En macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # En Windows
   ipconfig
   ```
5. **Abrir Expo Go** y escanear el QR que aparece en los logs del mobile
6. **O conectar manualmente** usando la IP:puerto (ej: 192.168.1.100:19000)

## URLs de Acceso

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Mobile Metro**: http://localhost:8081
- **Expo DevTools**: http://localhost:19002
- **Adminer (DB)**: http://localhost:8080

## Troubleshooting

### Mobile no se conecta desde el teléfono
1. Verificar que estés en la misma red WiFi
2. Verificar que los puertos estén abiertos
3. Usar la IP específica en lugar de localhost

### Cache issues
```bash
make mobile-clean  # Limpiar cache de Expo/Metro
```

### Reinstalar dependencias
```bash
make api-deps     # API
make mobile-deps  # Mobile
```

## Desarrollo

- **Hot reload** está habilitado para ambos servicios
- Los cambios en código se reflejan automáticamente
- Los volúmenes están configurados para desarrollo