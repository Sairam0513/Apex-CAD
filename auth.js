<!-- UPDATED FIREBASE v10 MODULAR SDK WITH EMAIL VERIFICATION & PASSWORD RESET -->
<script type="module">
    import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { 
        getAuth, 
        signInWithEmailAndPassword, 
        createUserWithEmailAndPassword,
        signOut,
        sendEmailVerification,
        sendPasswordResetEmail
    } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
    import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

    const firebaseConfig = {
        apiKey: "AIzaSyBy18nqqaq3nsaFkv3E7hmyJhQOv6gGg_g",
        authDomain: "apex-cad-solutions.firebaseapp.com",
        projectId: "apex-cad-solutions",
        storageBucket: "apex-cad-solutions.firebasestorage.app",
        messagingSenderId: "701417388296",
        appId: "1:701417388296:web:6173bd62d6cfa4014ad4bd"
    };

    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    let currentUserType = { signin: 'user', signup: 'user' };

    // ================================================
    // EXISTING FUNCTIONS (unchanged)
    // ================================================
    window.scrollToAuth = function(tab) {
        document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => window.switchAuthTab(tab), 500);
    };

    window.switchAuthTab = function(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        if (tab === 'signin') {
            document.querySelectorAll('.auth-tab')[0].classList.add('active');
            document.getElementById('signInForm').classList.add('active');
        } else {
            document.querySelectorAll('.auth-tab')[1].classList.add('active');
            document.getElementById('signUpForm').classList.add('active');
        }
    };

    window.selectUserType = function(form, type) {
        currentUserType[form] = type;
        const toggles = document.querySelectorAll(`#${form === 'signin' ? 'signInForm' : 'signUpForm'} .toggle-option`);
        toggles.forEach(t => t.classList.remove('active'));
        toggles[type === 'user' ? 0 : 1].classList.add('active');
        
        if (form === 'signup') {
            const collegeField = document.getElementById('college-field');
            collegeField.style.display = type === 'user' ? 'block' : 'none';
        }
    };

    window.togglePassword = function(inputId, icon) {
        const input = document.getElementById(inputId);
        const i = icon.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            i.classList.remove('fa-eye');
            i.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            i.classList.remove('fa-eye-slash');
            i.classList.add('fa-eye');
        }
    };

    function showAlert(form, message, type) {
        const alertDiv = document.getElementById(`${form}-alert`);
        alertDiv.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                ${message}
            </div>
        `;
        if (type === 'success') {
            setTimeout(() => alertDiv.innerHTML = '', 5000);
        }
    }

    // ================================================
    // ✅ NEW: PASSWORD RESET FUNCTIONS
    // ================================================
    window.openPasswordReset = function() {
        document.getElementById('passwordResetModal').style.display = 'flex';
        document.getElementById('resetEmail').focus();
    };

    window.closePasswordReset = function() {
        document.getElementById('passwordResetModal').style.display = 'none';
        document.getElementById('resetEmail').value = '';
    };

    window.resetPassword = async function() {
        const resetEmail = document.getElementById('resetEmail').value.trim();

        if (!resetEmail) {
            showAlert('signin', '❌ Please enter your email address.', 'error');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            showAlert('signin', '✅ Password reset link sent! Check your email inbox and spam folder.', 'success');
            
            // Close modal and clear form
            window.closePasswordReset();
            
        } catch (error) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/user-not-found') {
                showAlert('signin', '❌ Email not found in our system.', 'error');
            } else {
                showAlert('signin', '❌ Error: ' + error.message, 'error');
            }
        }
    };

    // Close modal on outside click
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('passwordResetModal');
        if (event.target === modal) {
            window.closePasswordReset();
        }
    });

    // Allow Enter key in password reset email field
    document.addEventListener('DOMContentLoaded', function() {
        const resetEmail = document.getElementById('resetEmail');
        if (resetEmail) {
            resetEmail.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    window.resetPassword();
                }
            });
        }
    });

    // ================================================
    // ✅ NEW: RESEND VERIFICATION EMAIL FUNCTION
    // ================================================
    window.resendVerificationEmail = async function() {
        const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');

        if (!pendingEmail) {
            showAlert('signin', '❌ Email not found. Please try signing in again.', 'error');
            return;
        }

        try {
            // Prompt for password to re-authenticate
            const password = prompt('Please enter your password to resend verification email:');
            if (!password) return;

            // Sign in temporarily
            const tempCredential = await signInWithEmailAndPassword(auth, pendingEmail, password);
            
            // Send verification email
            await sendEmailVerification(tempCredential.user);
            
            // Sign out again
            await signOut(auth);
            
            showAlert('signin', '✅ Verification email resent! Check your inbox and click the verification link.', 'success');
            
            // Hide resend section
            document.getElementById('resendEmailSection').style.display = 'none';
            
        } catch (error) {
            console.error('Resend verification error:', error);
            if (error.code === 'auth/wrong-password') {
                showAlert('signin', '❌ Incorrect password. Please try again.', 'error');
            } else {
                showAlert('signin', '❌ Error: ' + error.message, 'error');
            }
        }
    };

    // ================================================
    // UPDATED SIGN IN HANDLER - WITH EMAIL VERIFICATION CHECK
    // ================================================
    document.getElementById('signInForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const userType = currentUserType.signin;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                await signOut(auth);
                throw new Error('User data not found');
            }

            const userData = userDoc.data();
            
            if (userData.userType !== userType) {
                await signOut(auth);
                throw new Error(`Please select ${userData.userType === 'admin' ? 'Admin' : 'Student'} to login`);
            }

            // ✅ NEW: CHECK IF EMAIL IS VERIFIED
            if (!user.emailVerified) {
                await signOut(auth);
                
                // Store email for resend function
                sessionStorage.setItem('pendingVerificationEmail', email);
                
                // Show error and resend section
                showAlert('signin', '❌ Please verify your email before logging in. We sent you a verification link.', 'error');
                document.getElementById('resendEmailSection').style.display = 'block';
                
                return; // Stop login process
            }

            // ✅ EMAIL IS VERIFIED - PROCEED WITH LOGIN
            sessionStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: userData.email,
                name: userData.name,
                userType: userData.userType,
                phone: userData.phone,
                college: userData.college
            }));

            showAlert('signin', '✅ Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = userType === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Sign in error:', error);
            showAlert('signin', error.message || 'Sign in failed', 'error');
        }
    });

    // ================================================
    // UPDATED SIGN UP HANDLER - WITH EMAIL VERIFICATION
    // ================================================
    document.getElementById('signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const phone = document.getElementById('signup-phone').value;
        const email = document.getElementById('signup-email').value;
        const college = document.getElementById('signup-college').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const userType = currentUserType.signup;

        if (password !== confirmPassword) {
            showAlert('signup', 'Passwords do not match', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // ✅ NEW: SEND VERIFICATION EMAIL
            await sendEmailVerification(userCredential.user);

            // Save user data to Firestore
            const userData = {
                uid: userCredential.user.uid,
                name,
                email,
                phone,
                userType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            if (userType === 'user') {
                userData.college = college;
            }

            await setDoc(doc(db, 'users', userCredential.user.uid), userData);

            // ✅ NEW: SIGN OUT USER IMMEDIATELY
            await signOut(auth);

            // ✅ NEW: SHOW VERIFICATION MESSAGE
            showAlert('signup', '✅ Account created! Verification email sent to ' + email + '. Please check your email and click the verification link before logging in.', 'success');

            // Clear form
            document.getElementById('signUpForm').reset();

        } catch (error) {
            console.error('Sign up error:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                showAlert('signup', 'This email is already registered. Please sign in instead.', 'error');
            } else {
                showAlert('signup', error.message || 'Sign up failed', 'error');
            }
        }
    });

    // ================================================
    // INITIALIZE
    // ================================================
    window.selectUserType('signin', 'user');
    window.selectUserType('signup', 'user');
</script>
