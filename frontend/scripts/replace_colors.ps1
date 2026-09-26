$file = "D:\E commerse\frontend\src\app\globals.css"
$content = Get-Content $file -Raw

# ============================================
# Handle #b12704: first mark deal/accent uses, then replace error uses, then restore
# ============================================

# Deal/accent #b12704 -> mark with placeholder
# 1. Gradient in discount-badge
$content = $content -replace 'linear-gradient\(135deg, #cc0c39, #b12704\)', 'linear-gradient(135deg, var(--tertiary), var(--tertiary))'
# 2. Gradient in deal-badge
$content = $content -replace 'linear-gradient\(135deg, #cc0c39, #e8112d\)', 'linear-gradient(135deg, var(--tertiary), var(--tertiary-dim))'

# For the remaining #b12704 deal/accent uses (not error), use class-context matching
# Replace all #b12704 that should be var(--tertiary) by their CSS class context
$content = $content -replace '(\.sticky-cart-price\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.countdown-small\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.countdown-expired\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.coupon-badge[^{]*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.price-box \.current-price\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.mini-product-price\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.fbt-total-price\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.coupon-clip-icon\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'
$content = $content -replace '(\.coupon-clip-code\s*\{[^}]*?)color: #b12704', '$1color: var(--tertiary)'

# Handle the coupon-badge background: #fff0f0 and color: #b12704 combo
$content = $content -replace '(\.coupon-badge\s*\{[^}]*?)background: #fff0f0', '$1background: var(--error-light)'

# Now replace remaining #b12704 with var(--error) for error states
$content = $content -replace '#b12704', 'var(--error)'

# ============================================
# Color replacements (simple one-to-one)
# ============================================

$content = $content -replace '#e88a00', 'var(--tertiary-dim)'
$content = $content -replace '#f5a623', 'var(--tertiary-light)'
$content = $content -replace '#1a472a', 'var(--tertiary)'
$content = $content -replace '#2a4050', 'var(--primary-light)'
$content = $content -replace '#155724', 'var(--success)'
$content = $content -replace '#856404', 'var(--on-secondary-container)'
$content = $content -replace '#721c24', 'var(--error)'
$content = $content -replace '#004085', 'var(--tertiary-dim)'
$content = $content -replace '#d4edda', 'var(--success-light)'
$content = $content -replace '#fff3cd', 'var(--secondary-container)'
$content = $content -replace '#f8d7da', 'var(--error-light)'
$content = $content -replace '#cce5ff', 'var(--tertiary-container)'
$content = $content -replace '#fff8f0', 'var(--secondary-container)'
$content = $content -replace '#0d2137', 'var(--tertiary-dim)'
$content = $content -replace '#1a3a4a', 'var(--tertiary-dim)'
$content = $content -replace '#2d1b3a', 'var(--tertiary-dim)'
$content = $content -replace '#aab7c4', 'var(--text-light)'
$content = $content -replace '#6f7e8f', 'var(--text-light)'
$content = $content -replace '#8899aa', 'var(--text-light)'
$content = $content -replace '#0b1219', 'var(--tertiary-dim)'
$content = $content -replace '#37475a', 'var(--tertiary-dim)'
$content = $content -replace '#1a3650', 'var(--tertiary-dim)'
$content = $content -replace '#febd69', 'var(--rating-star)'
$content = $content -replace '#067d62', 'var(--success)'
$content = $content -replace '#007185', 'var(--tertiary)'
$content = $content -replace '#0f1111', 'var(--text)'
$content = $content -replace '#131921', 'var(--tertiary-dim)'
$content = $content -replace '#232f3e', 'var(--tertiary-dim)'
$content = $content -replace '#f90', 'var(--rating-star)'
$content = $content -replace '#f8f8f8', 'var(--surface-container-low)'
$content = $content -replace '#f8f9fa', 'var(--surface-container-low)'
$content = $content -replace '#fafafa', 'var(--surface-container-low)'

# ============================================
# rgba replacements
# ============================================
$content = $content -replace 'rgba\(255,\s*153,\s*0,\s*', 'rgba(0,99,127,'
$content = $content -replace 'rgba\(255,\s*153,\s*0', 'rgba(0,99,127'

# ============================================
# #ccc, #ddd, #eee replacements
# ============================================
$content = $content -replace '(?<!var\(--[a-z-]+\)) #ccc([^0-9a-fA-F])', ' var(--text-light)$1'
$content = $content -replace '(?<!var\(--[a-z-]+\)) #ddd([^0-9a-fA-F])', ' var(--border)$1'
$content = $content -replace '(?<!var\(--[a-z-]+\)) #eee([^0-9a-fA-F])', ' var(--border-light)$1'

# Handle edge case at end of line
$content = $content -replace '(?<!var\(--[a-z-]+\))#ccc\s*$', 'var(--text-light)'
$content = $content -replace '(?<!var\(--[a-z-]+\))#ddd\s*$', 'var(--border)'
$content = $content -replace '(?<!var\(--[a-z-]+\))#eee\s*$', 'var(--border-light)'

# ============================================
# white / #fff replacements (context-sensitive)
# ============================================

# color: white -> var(--text-white)
$content = $content -replace 'color:\s*white(\s*;|\s*!important)', 'color: var(--text-white)$1'

# radial-gradient with white
$content = $content -replace 'radial-gradient\(circle,\s*white\s*0%', 'radial-gradient(circle, var(--text-white) 0%'

# background: white -> var(--bg-card) (for most card/box/button backgrounds)
$content = $content -replace '(?<!var\(--[a-z-]+\))background:\s*white(\s*;|\s*!important)', 'background: var(--bg-card)$1'

# #fff in hero gradient
$content = $content -replace '(background:\s*linear-gradient\(135deg,\s*)#fff', '$1var(--text-white)'

# ============================================
# Gradient fixes: secondary/secondary-dark -> tertiary/tertiary-dim  
# ============================================
$content = $content -replace 'linear-gradient\(135deg,\s*var\(--secondary\),\s*var\(--secondary-dark\)\)', 'linear-gradient(135deg, var(--tertiary), var(--tertiary-dim))'

# ============================================
# Write back
# ============================================
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Replacements complete!"
