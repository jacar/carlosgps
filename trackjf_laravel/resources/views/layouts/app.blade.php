<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'TRACKJF Pro')</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Core CSS (Derived from your premium design) -->
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    @stack('styles')
</head>
<body class="bg-dark text-white">
    <div class="app-container">
        <!-- Sidebar Navigation -->
        @include('partials.sidebar')

        <main class="main-content">
            <!-- Header / Topbar -->
            @include('partials.header')

            <!-- Page Content -->
            <div class="container-fluid p-4">
                @yield('content')
            </div>
        </main>
    </div>

    <!-- Core Scripts -->
    <script src="{{ asset('assets/js/api.js') }}"></script>
    @stack('scripts')
</body>
</html>
