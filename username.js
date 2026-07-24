document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://uaawwwdyjogseeanzfav.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXd3d2R5am9nc2VlYW56ZmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzYwNzcsImV4cCI6MjEwMDIxMjA3N30.gjDWOzU1O1sXH3VcP1IIEUp0uQzpRdF_xzzZ9Rwxluk';
    
    let client;
    try {
        client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Supabase client initialization failed:', error);
    }

    let currentUser = null;
    let selectedAvatarFile = null;
    let isUsernameValid = false;
    let usernameDebounceTimer;

    const DOM = {
        form: document.getElementById('profileForm'),
        displayName: document.getElementById('displayName'),
        username: document.getElementById('username'),
        usernameStatusIcon: document.getElementById('usernameStatusIcon'),
        usernameHelper: document.getElementById('usernameHelper'),
        bio: document.getElementById('bio'),
        charCount: document.getElementById('charCount'),
        genderDropdown: document.getElementById('genderDropdown'),
        selectedGender: document.getElementById('selectedGender'),
        cameraBtn: document.getElementById('cameraBtn'),
        avatarInput: document.getElementById('avatarInput'),
        avatarPreview: document.getElementById('avatarPreview'),
        avatarPlaceholder: document.getElementById('avatarPlaceholder'),
        submitBtn: document.getElementById('submitBtn'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        toastContainer: document.getElementById('toastContainer'),
        backBtn: document.getElementById('backBtn')
    };

    let userGender = '';

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'ri-checkbox-circle-fill text-success' : 'ri-error-warning-fill text-error';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    const checkSession = async () => {
        try {
            const { data: { session }, error } = await client.auth.getSession();
            if (error || !session) {
                window.location.href = 'index.html';
                return;
            }
            currentUser = session.user;
            await checkExistingProfile(currentUser.id);
        } catch (err) {
            showToast('Authentication error', 'error');
            window.location.href = 'index.html';
        }
    };

    const checkExistingProfile = async (userId) => {
        try {
            const { data, error } = await client
                .from('users')
                .select('id')
                .eq('id', userId)
                .single();
            
            if (data) {
                window.location.href = 'home.html';
            }
        } catch (err) {
            console.error('Error checking profile:', err);
        }
    };

    if (client) {
        await checkSession();
    }

    DOM.backBtn.addEventListener('click', () => {
        window.history.back();
    });

    DOM.cameraBtn.addEventListener('click', () => {
        DOM.avatarInput.click();
    });

    DOM.avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be less than 2MB', 'error');
            DOM.avatarInput.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Please upload a valid image file', 'error');
            DOM.avatarInput.value = '';
            return;
        }

        selectedAvatarFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.avatarPreview.src = e.target.result;
            DOM.avatarPreview.classList.remove('hidden');
            DOM.avatarPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });

    DOM.bio.addEventListener('input', (e) => {
        const currentLength = e.target.value.length;
        DOM.charCount.textContent = currentLength;
        if (currentLength >= 150) {
            DOM.charCount.style.color = 'var(--error-red)';
        } else {
            DOM.charCount.style.color = 'var(--text-muted)';
        }
    });

    const options = document.querySelectorAll('.dropdown-option');
    DOM.genderDropdown.addEventListener('click', (e) => {
        DOM.genderDropdown.classList.toggle('active');
        e.stopPropagation();
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            userGender = option.dataset.value;
            DOM.selectedGender.textContent = option.textContent;
            DOM.selectedGender.style.color = 'var(--text-main)';
            DOM.genderDropdown.classList.remove('error');
        });
    });

    document.addEventListener('click', (e) => {
        if (!DOM.genderDropdown.contains(e.target)) {
            DOM.genderDropdown.classList.remove('active');
        }
    });

    const setUsernameStatus = (status, message = '') => {
        DOM.usernameStatusIcon.classList.remove('hidden', 'spin-anim', 'ri-loader-4-line', 'ri-checkbox-circle-fill', 'ri-close-circle-fill', 'text-success', 'text-error', 'text-muted');
        
        switch(status) {
            case 'loading':
                DOM.usernameStatusIcon.classList.add('ri-loader-4-line', 'spin-anim', 'text-muted');
                DOM.usernameHelper.innerHTML = `<i class="ri-loader-4-line spin-anim"></i> Checking availability...`;
                DOM.usernameHelper.className = 'helper-text text-muted';
                isUsernameValid = false;
                break;
            case 'success':
                DOM.usernameStatusIcon.classList.add('ri-checkbox-circle-fill', 'text-success');
                DOM.usernameHelper.innerHTML = `<i class="ri-shield-check-line"></i> ${message}`;
                DOM.usernameHelper.className = 'helper-text text-success';
                isUsernameValid = true;
                break;
            case 'error':
                DOM.usernameStatusIcon.classList.add('ri-close-circle-fill', 'text-error');
                DOM.usernameHelper.innerHTML = `<i class="ri-error-warning-line"></i> ${message}`;
                DOM.usernameHelper.className = 'helper-text text-error';
                isUsernameValid = false;
                break;
            default:
                DOM.usernameStatusIcon.classList.add('hidden');
                DOM.usernameHelper.innerHTML = `<i class="ri-information-line"></i> Only lowercase letters, numbers, and underscores`;
                DOM.usernameHelper.className = 'helper-text text-muted';
                isUsernameValid = false;
        }
    };

    const checkUsernameAvailability = async (username) => {
        try {
            const { data, error } = await client
                .from('users')
                .select('username')
                .eq('username', username)
                .single();
            
            if (data) {
                setUsernameStatus('error', 'Username is already taken');
            } else if (error && error.code === 'PGRST116') {
                setUsernameStatus('success', 'Username is available!');
            } else {
                throw error;
            }
        } catch (err) {
            setUsernameStatus('error', 'Error checking username');
        }
    };

    DOM.username.addEventListener('input', (e) => {
        let val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        e.target.value = val;
        
        clearTimeout(usernameDebounceTimer);
        
        if (val.length < 3) {
            setUsernameStatus('error', 'Username must be at least 3 characters');
            return;
        }
        if (val.length > 20) {
            setUsernameStatus('error', 'Username must be less than 20 characters');
            return;
        }

        setUsernameStatus('loading');
        
        usernameDebounceTimer = setTimeout(() => {
            checkUsernameAvailability(val);
        }, 500);
    });

    DOM.submitBtn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });

    DOM.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const displayName = DOM.displayName.value.trim();
        const username = DOM.username.value.trim();
        const bio = DOM.bio.value.trim();

        if (displayName.length < 2) {
            showToast('Display name must be at least 2 characters', 'error');
            return;
        }
if (DOM.submitBtn.disabled) return;
        if (!isUsernameValid) {
            showToast('Please choose a valid and available username', 'error');
            return;
        }

        if (!userGender) {
            DOM.genderDropdown.classList.add('error');
            showToast('Please select a gender', 'error');
            return;
        }

        if (!currentUser) {
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        DOM.loadingOverlay.classList.remove('hidden');
        DOM.submitBtn.disabled = true;

        try {
            let avatarUrl = null;

            if (selectedAvatarFile) {
                const fileExt = selectedAvatarFile.name.split('.').pop();
                const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await client.storage
                    .from('avatars')
                    .upload(filePath, selectedAvatarFile, { cacheControl: '3600', upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = client.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrlData.publicUrl;
            }

            const { error: dbError } = await client
                .from('users')
                .insert([{
                    id: currentUser.id,
                    username: username,
                    display_name: displayName,
                    gender: userGender,
                    bio: bio,
                    avatar_url: avatarUrl,
                    is_verified: false,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            DOM.loadingOverlay.classList.add('hidden');
            showToast('Profile created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);

        } catch (error) {
            console.error('Setup error:', error);
            DOM.loadingOverlay.classList.add('hidden');
            DOM.submitBtn.disabled = false;
            showToast(error.message || 'Failed to save profile. Please try again.', 'error');
        }
    });
});
