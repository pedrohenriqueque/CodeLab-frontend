import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AppBar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Toolbar, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import httpClient from '../../../shared/api/httpClient';
import { useAuth } from '../hooks/useAuthProvider';
import LogoutConfirmDialog from '../../../shared/components/LogoutConfirmDialog';

const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const generatePassword = () => {
  const values = new Uint32Array(10);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
};
const createForm = () => ({ nome: '', email: '', senha: generatePassword() });
const editForm = (teacher) => ({ nome: teacher.nome, email: teacher.email, senha: '' });

export default function AdminTeachersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(createForm);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const load = async () => {
    try { const { data } = await httpClient.get('/api/admin/professores'); setTeachers(data); }
    catch { setError('Não foi possível carregar professores.'); }
  };
  useEffect(() => { load(); }, []);
  const updateField = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  const openCreate = () => { setError(''); setForm(createForm()); setEditingTeacher({ isNew: true }); };
  const openEdit = (teacher) => { setError(''); setForm(editForm(teacher)); setEditingTeacher(teacher); };
  const closeEditor = () => { if (!isSaving) { setEditingTeacher(null); setError(''); } };
  const save = async (event) => {
    event.preventDefault();
    try {
      setError(''); setIsSaving(true);
      if (editingTeacher.isNew) { await httpClient.post('/api/admin/professores', form); setGeneratedPassword(form.senha); }
      else { const payload = { nome: form.nome, email: form.email }; if (form.senha) payload.senha = form.senha; await httpClient.patch(`/api/admin/professores/${editingTeacher.uuid}`, payload); }
      setEditingTeacher(null); await load();
    } catch (requestError) { setError(requestError.response?.data?.erro || 'Não foi possível salvar o professor.'); }
    finally { setIsSaving(false); }
  };
  const deactivate = async () => {
    if (!deletingTeacher) return;
    try { setError(''); setIsSaving(true); await httpClient.delete(`/api/admin/professores/${deletingTeacher.uuid}`); setDeletingTeacher(null); await load(); }
    catch (requestError) { setError(requestError.response?.data?.erro || 'Não foi possível excluir o professor.'); }
    finally { setIsSaving(false); }
  };
  const exit = () => { setShowLogoutConfirm(false); logout(); navigate('/login', { replace: true }); };
  const isNew = editingTeacher?.isNew;
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}><Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}><Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>CodeGrade · Administração</Typography><Button color="inherit" startIcon={<LogoutIcon />} onClick={() => setShowLogoutConfirm(true)}>Sair</Button></Toolbar></AppBar>
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2, mb: 3 }}><Box><Typography variant="h4">Professores</Typography><Typography color="text.secondary">{teachers.length} cadastrado(s)</Typography></Box><Button variant="contained" onClick={openCreate}>Novo professor</Button></Box>
      {generatedPassword && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setGeneratedPassword('')}>Professor cadastrado. Senha temporária: <strong>{generatedPassword}</strong>. Anote-a antes de fechar este aviso.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table><TableHead><TableRow><TableCell>Professor</TableCell><TableCell>E-mail</TableCell><TableCell>Status</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead><TableBody>
        {teachers.map((teacher) => <TableRow key={teacher.uuid}><TableCell>{teacher.nome}</TableCell><TableCell>{teacher.email}</TableCell><TableCell><Chip size="small" label="Ativo" color="success" /></TableCell><TableCell align="right"><IconButton aria-label={`Editar ${teacher.nome}`} onClick={() => openEdit(teacher)}><EditOutlinedIcon /></IconButton><IconButton aria-label={`Excluir ${teacher.nome}`} color="error" onClick={() => setDeletingTeacher(teacher)}><DeleteIcon /></IconButton></TableCell></TableRow>)}
        {teachers.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum professor cadastrado.</TableCell></TableRow>}
      </TableBody></Table></Paper>
    </Box>
    <Dialog open={Boolean(editingTeacher)} onClose={closeEditor} fullWidth maxWidth="xs"><Box component="form" onSubmit={save}><DialogTitle>{isNew ? 'Novo professor' : 'Editar professor'}</DialogTitle><DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Nome completo" value={form.nome} onChange={updateField('nome')} required autoFocus /><TextField label="E-mail institucional" type="email" value={form.email} onChange={updateField('email')} required /><Box><TextField label={isNew ? 'Senha temporária' : 'Nova senha (opcional)'} value={form.senha} onChange={updateField('senha')} required={isNew} inputProps={{ minLength: 8 }} fullWidth slotProps={isNew ? { input: { endAdornment: <IconButton aria-label="Gerar nova senha" onClick={() => setForm((previous) => ({ ...previous, senha: generatePassword() }))}><RefreshIcon /></IconButton> } } : undefined} /><Typography variant="caption" color="text.secondary">{isNew ? 'O professor poderá usar esta senha no primeiro acesso.' : 'Deixe em branco para manter a senha atual. Se preenchida, use ao menos 8 caracteres.'}</Typography></Box></Box></DialogContent><DialogActions><Button onClick={closeEditor} disabled={isSaving}>Cancelar</Button><Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button></DialogActions></Box></Dialog>
    <Dialog open={Boolean(deletingTeacher)} onClose={() => !isSaving && setDeletingTeacher(null)} maxWidth="xs" fullWidth><DialogTitle>Excluir professor?</DialogTitle><DialogContent><Typography>“{deletingTeacher?.nome}” perderá o acesso ao sistema. O cadastro será preservado para auditoria.</Typography></DialogContent><DialogActions><Button onClick={() => setDeletingTeacher(null)} disabled={isSaving}>Cancelar</Button><Button color="error" variant="contained" onClick={deactivate} disabled={isSaving}>{isSaving ? 'Excluindo...' : 'Excluir'}</Button></DialogActions></Dialog>
    <LogoutConfirmDialog
      open={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      onConfirm={exit}
    />
  </Box>;
}