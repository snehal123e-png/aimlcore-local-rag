import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const API = "http://127.0.0.1:8000";

const Icon = ({ name, size = 19 }) => {
    const icons = {
        grid: "▦",
        book: "▤",
        file: "▱",
        chat: "◌",
        search: "⌕",
        chart: "◫",
        settings: "⚙",
        plus: "+",
        upload: "↑",
        send: "➤",
        trash: "♲",
        refresh: "↻",
        check: "✓",
        close: "×",
        menu: "☰",
        bot: "✦",
        database: "◉",
        clock: "◷",
        more: "•••",
    };

    return (
        <span
            className="icon"
            style={{ fontSize: size }}
            aria-hidden="true"
        >
            {icons[name] || "•"}
        </span>
    );
};

function App() {
    const [activePage, setActivePage] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [knowledgeBases, setKnowledgeBases] = useState([]);
    const [selectedKB, setSelectedKB] = useState(null);

    const [documents, setDocuments] = useState([]);
    const [models, setModels] = useState([]);

    const [loading, setLoading] = useState(true);
    const [backendOnline, setBackendOnline] = useState(false);

    const [showCreateKB, setShowCreateKB] = useState(false);
    const [newKBName, setNewKBName] = useState("");
    const [newKBDescription, setNewKBDescription] = useState("");

    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedKB?.id) {
            loadDocuments(selectedKB.id);
        }
    }, [selectedKB]);

    async function loadInitialData() {
        setLoading(true);

        try {
            const health = await fetch(`${API}/api/system/health`);
            setBackendOnline(health.ok);
        } catch {
            setBackendOnline(false);
        }

        try {
            const kbResponse = await fetch(`${API}/api/knowledge-bases`);

            if (kbResponse.ok) {
                const data = await kbResponse.json();

                const list = Array.isArray(data)
                    ? data
                    : data.knowledge_bases || data.items || [];

                setKnowledgeBases(list);

                if (list.length > 0) {
                    setSelectedKB(list[0]);
                }
            }
        } catch (error) {
            console.error("Knowledge base error:", error);
        }

        try {
            const modelResponse = await fetch(`${API}/api/system/models`);

            if (modelResponse.ok) {
                const data = await modelResponse.json();
                setModels(data.models || []);
            }
        } catch (error) {
            console.error("Models error:", error);
        }

        setLoading(false);
    }

    async function loadDocuments(kbId) {
        try {
            const response = await fetch(
                `${API}/api/documents?kb_id=${kbId}`
            );

            if (!response.ok) return;

            const data = await response.json();

            const list = Array.isArray(data)
                ? data
                : data.documents || data.items || [];

            setDocuments(list);
        } catch (error) {
            console.error("Documents error:", error);
        }
    }

    async function createKnowledgeBase(e) {
        e.preventDefault();

        if (!newKBName.trim()) return;

        try {
            const response = await fetch(`${API}/api/knowledge-bases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newKBName.trim(),
                    description: newKBDescription.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create knowledge base");
            }

            const kb = await response.json();

            setKnowledgeBases((prev) => [...prev, kb]);
            setSelectedKB(kb);

            setNewKBName("");
            setNewKBDescription("");
            setShowCreateKB(false);

            setActivePage("documents");
        } catch (error) {
            alert(error.message);
        }
    }

    async function uploadFiles(files) {
        if (!selectedKB) {
            alert("Please create or select a Knowledge Base first.");
            return;
        }

        if (!files?.length) return;

        setUploading(true);

        for (const file of files) {
            try {
                const formData = new FormData();

                formData.append("file", file);
                formData.append("kb_id", selectedKB.id);

                const response = await fetch(
                    `${API}/api/documents/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const text = await response.text();
                    console.error("Upload failed:", text);
                    continue;
                }
            } catch (error) {
                console.error("Upload error:", error);
            }
        }

        await loadDocuments(selectedKB.id);
        setUploading(false);
    }

    function handleFileChange(e) {
        uploadFiles(Array.from(e.target.files || []));
        e.target.value = "";
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files || []);
        uploadFiles(files);
    }

    async function deleteDocument(id) {
        if (!window.confirm("Delete this document?")) return;

        try {
            const response = await fetch(
                `${API}/api/documents/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete document");
            }

            await loadDocuments(selectedKB.id);
        } catch (error) {
            alert(error.message);
        }
    }

    async function reindexDocument(id) {
        try {
            const response = await fetch(
                `${API}/api/documents/${id}/reindex`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {
                throw new Error("Re-index failed");
            }

            await loadDocuments(selectedKB.id);
        } catch (error) {
            alert(error.message);
        }
    }

    async function deleteKnowledgeBase(id) {
        if (
            !window.confirm(
                "Delete this Knowledge Base and its data?"
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/api/knowledge-bases/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete Knowledge Base");
            }

            const remaining = knowledgeBases.filter(
                (kb) => kb.id !== id
            );

            setKnowledgeBases(remaining);
            setSelectedKB(remaining[0] || null);
            setDocuments([]);

            setActivePage("dashboard");
        } catch (error) {
            alert(error.message);
        }
    }

    async function askQuestion(e) {
        e?.preventDefault();

        if (!question.trim()) return;

        if (!selectedKB) {
            alert("Please select a Knowledge Base first.");
            return;
        }

        const currentQuestion = question.trim();

        setQuestion("");

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: currentQuestion,
            },
        ]);

        setChatLoading(true);

        try {
            const response = await fetch(`${API}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    knowledge_base_id: selectedKB.id,
                    question: currentQuestion,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Chat request failed"
                );
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        data.answer ||
                        data.response ||
                        "I could not generate an answer.",
                    sources:
                        data.sources ||
                        data.citations ||
                        [],
                },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "I couldn't connect to the RAG service. Please make sure the backend and Ollama are running.",
                    error: true,
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    }

    const stats = useMemo(() => {
        const ready = documents.filter(
            (doc) =>
                String(doc.status || "").toLowerCase() === "ready"
        ).length;

        return {
            knowledgeBases: knowledgeBases.length,
            documents: documents.length,
            readyDocuments: ready,
            model: models[0]?.name || "llama3.2:3b",
        };
    }, [knowledgeBases, documents, models]);

    function navigate(page) {
        setActivePage(page);
        setSidebarOpen(false);
    }

    return (
        <div className="app-shell">
            <aside
                className={`sidebar ${sidebarOpen ? "sidebar-open" : ""
                    }`}
            >
                <div className="brand">
                    <div className="brand-mark">A</div>

                    <div>
                        <div className="brand-name">AIMLCore</div>
                        <div className="brand-subtitle">
                            Local Intelligence
                        </div>
                    </div>
                </div>

                <button
                    className="new-kb-button"
                    onClick={() => setShowCreateKB(true)}
                >
                    <Icon name="plus" />
                    New Knowledge Base
                </button>

                <div className="sidebar-section">
                    <div className="section-label">WORKSPACE</div>

                    <NavItem
                        icon="grid"
                        label="Dashboard"
                        active={activePage === "dashboard"}
                        onClick={() => navigate("dashboard")}
                    />

                    <NavItem
                        icon="book"
                        label="Knowledge Bases"
                        active={activePage === "knowledge"}
                        onClick={() => navigate("knowledge")}
                        count={knowledgeBases.length}
                    />

                    <NavItem
                        icon="file"
                        label="Documents"
                        active={activePage === "documents"}
                        onClick={() => navigate("documents")}
                        count={documents.length}
                    />

                    <NavItem
                        icon="chat"
                        label="AI Chat"
                        active={activePage === "chat"}
                        onClick={() => navigate("chat")}
                    />

                    <NavItem
                        icon="search"
                        label="Search"
                        active={activePage === "search"}
                        onClick={() => navigate("search")}
                    />

                    <NavItem
                        icon="chart"
                        label="Evaluation"
                        active={activePage === "evaluation"}
                        onClick={() => navigate("evaluation")}
                    />
                </div>

                <div className="sidebar-section kb-list-section">
                    <div className="section-title-row">
                        <span className="section-label">KNOWLEDGE BASES</span>

                        <button
                            className="mini-add"
                            onClick={() => setShowCreateKB(true)}
                        >
                            +
                        </button>
                    </div>

                    <div className="kb-list">
                        {knowledgeBases.length === 0 ? (
                            <div className="sidebar-empty">
                                No knowledge bases yet.
                            </div>
                        ) : (
                            knowledgeBases.map((kb) => (
                                <button
                                    key={kb.id}
                                    className={`kb-sidebar-item ${selectedKB?.id === kb.id
                                            ? "selected"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setSelectedKB(kb);
                                        navigate("documents");
                                    }}
                                >
                                    <span className="kb-dot"></span>

                                    <span className="kb-name">
                                        {kb.name}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="sidebar-bottom">
                    <div className="ollama-status">
                        <span className="status-dot"></span>

                        <div>
                            <strong>Local AI</strong>
                            <small>
                                {backendOnline
                                    ? "Ollama connected"
                                    : "Backend offline"}
                            </small>
                        </div>
                    </div>

                    <button
                        className="nav-item settings-item"
                        onClick={() => navigate("settings")}
                    >
                        <Icon name="settings" />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="main-area">
                <header className="topbar">
                    <button
                        className="mobile-menu"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Icon name="menu" size={23} />
                    </button>

                    <div className="breadcrumb">
                        <span>AIMLCore</span>
                        <span>/</span>
                        <strong>
                            {pageTitle(activePage)}
                        </strong>
                    </div>

                    <div className="topbar-right">
                        <div
                            className={`connection ${backendOnline ? "online" : "offline"
                                }`}
                        >
                            <span></span>
                            {backendOnline
                                ? "Local AI Online"
                                : "Offline"}
                        </div>

                        <div className="avatar">AI</div>
                    </div>
                </header>

                <div className="page-content">
                    {activePage === "dashboard" && (
                        <Dashboard
                            selectedKB={selectedKB}
                            stats={stats}
                            documents={documents}
                            onCreate={() => setShowCreateKB(true)}
                            onUpload={() =>
                                fileInputRef.current?.click()
                            }
                            onChat={() => navigate("chat")}
                            onDocuments={() => navigate("documents")}
                            uploading={uploading}
                        />
                    )}

                    {activePage === "knowledge" && (
                        <KnowledgeBases
                            knowledgeBases={knowledgeBases}
                            selectedKB={selectedKB}
                            setSelectedKB={setSelectedKB}
                            onCreate={() => setShowCreateKB(true)}
                            onDelete={deleteKnowledgeBase}
                            onOpenDocuments={() => navigate("documents")}
                        />
                    )}

                    {activePage === "documents" && (
                        <DocumentsPage
                            selectedKB={selectedKB}
                            documents={documents}
                            uploading={uploading}
                            dragActive={dragActive}
                            setDragActive={setDragActive}
                            onUpload={uploadFiles}
                            onFileSelect={() =>
                                fileInputRef.current?.click()
                            }
                            onDelete={deleteDocument}
                            onReindex={reindexDocument}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                        />
                    )}

                    {activePage === "chat" && (
                        <ChatPage
                            selectedKB={selectedKB}
                            messages={messages}
                            question={question}
                            setQuestion={setQuestion}
                            onAsk={askQuestion}
                            loading={chatLoading}
                            onSelectKB={() => navigate("knowledge")}
                        />
                    )}

                    {activePage === "search" && (
                        <SearchPage
                            selectedKB={selectedKB}
                            onSelectKB={() => navigate("knowledge")}
                        />
                    )}

                    {activePage === "evaluation" && (
                        <EvaluationPage />
                    )}

                    {activePage === "settings" && (
                        <SettingsPage
                            backendOnline={backendOnline}
                            models={models}
                        />
                    )}
                </div>
            </main>

            {showCreateKB && (
                <Modal
                    title="Create Knowledge Base"
                    onClose={() => setShowCreateKB(false)}
                >
                    <form onSubmit={createKnowledgeBase}>
                        <label>Knowledge Base Name</label>

                        <input
                            autoFocus
                            value={newKBName}
                            onChange={(e) =>
                                setNewKBName(e.target.value)
                            }
                            placeholder="e.g. Company Policies"
                        />

                        <label>Description</label>

                        <textarea
                            value={newKBDescription}
                            onChange={(e) =>
                                setNewKBDescription(e.target.value)
                            }
                            placeholder="Describe what this knowledge base contains..."
                            rows="4"
                        />

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setShowCreateKB(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                <Icon name="plus" size={17} />
                                Create Knowledge Base
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function NavItem({
    icon,
    label,
    active,
    onClick,
    count,
}) {
    return (
        <button
            className={`nav-item ${active ? "active" : ""}`}
            onClick={onClick}
        >
            <Icon name={icon} />

            <span>{label}</span>

            {count !== undefined && count > 0 && (
                <span className="nav-count">{count}</span>
            )}
        </button>
    );
}

function Dashboard({
    selectedKB,
    stats,
    documents,
    onCreate,
    onUpload,
    onChat,
    onDocuments,
    uploading,
}) {
    return (
        <div className="dashboard-page">
            <section className="hero">
                <div>
                    <div className="eyebrow">
                        <span className="spark">✦</span>
                        PRIVATE LOCAL AI
                    </div>

                    <h1>
                        Your knowledge.
                        <br />
                        <span>Your AI.</span>
                    </h1>

                    <p>
                        Ask questions about your private documents
                        using a local RAG pipeline powered by Ollama.
                    </p>

                    {selectedKB ? (
                        <div className="current-kb">
                            <span className="current-kb-icon">
                                <Icon name="database" />
                            </span>

                            <div>
                                <small>ACTIVE KNOWLEDGE BASE</small>
                                <strong>{selectedKB.name}</strong>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="primary-button hero-button"
                            onClick={onCreate}
                        >
                            <Icon name="plus" />
                            Create your first Knowledge Base
                        </button>
                    )}
                </div>

                <div className="hero-visual">
                    <div className="orb">
                        <div className="orb-core">✦</div>
                    </div>

                    <div className="floating-card card-one">
                        <span>RAG</span>
                        <strong>Active</strong>
                    </div>

                    <div className="floating-card card-two">
                        <span>MODEL</span>
                        <strong>Local</strong>
                    </div>
                </div>
            </section>

            <section className="stats-grid">
                <StatCard
                    icon="book"
                    label="Knowledge Bases"
                    value={stats.knowledgeBases}
                />

                <StatCard
                    icon="file"
                    label="Documents"
                    value={stats.documents}
                />

                <StatCard
                    icon="check"
                    label="Ready Documents"
                    value={stats.readyDocuments}
                />

                <StatCard
                    icon="bot"
                    label="Local Model"
                    value="Llama 3.2"
                    small
                />
            </section>

            <section className="workspace-grid">
                <div className="panel quick-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="panel-kicker">
                                GET STARTED
                            </span>
                            <h2>Build your knowledge space</h2>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <button onClick={onUpload}>
                            <div className="quick-icon upload-icon">
                                <Icon name="upload" size={23} />
                            </div>

                            <div>
                                <strong>
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload documents"}
                                </strong>
                                <span>
                                    PDF, DOCX, TXT, MD or CSV
                                </span>
                            </div>

                            <span className="arrow">→</span>
                        </button>

                        <button onClick={onChat}>
                            <div className="quick-icon chat-icon">
                                <Icon name="chat" size={23} />
                            </div>

                            <div>
                                <strong>Ask your AI</strong>
                                <span>
                                    Get grounded answers with sources
                                </span>
                            </div>

                            <span className="arrow">→</span>
                        </button>

                        <button onClick={onDocuments}>
                            <div className="quick-icon doc-icon">
                                <Icon name="file" size={23} />
                            </div>

                            <div>
                                <strong>Manage documents</strong>
                                <span>
                                    View processing and indexing status
                                </span>
                            </div>

                            <span className="arrow">→</span>
                        </button>
                    </div>
                </div>

                <div className="panel recent-panel">
                    <div className="panel-heading">
                        <div>
                            <span className="panel-kicker">
                                RECENT
                            </span>
                            <h2>Documents</h2>
                        </div>

                        <button
                            className="text-button"
                            onClick={onDocuments}
                        >
                            View all →
                        </button>
                    </div>

                    {documents.length === 0 ? (
                        <EmptyDocuments />
                    ) : (
                        <div className="recent-list">
                            {documents.slice(0, 5).map((doc) => (
                                <DocumentRow
                                    key={doc.id}
                                    document={doc}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon, label, value, small }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">
                <Icon name={icon} size={20} />
            </div>

            <div>
                <span>{label}</span>
                <strong className={small ? "model-value" : ""}>
                    {value}
                </strong>
            </div>
        </div>
    );
}

function KnowledgeBases({
    knowledgeBases,
    selectedKB,
    setSelectedKB,
    onCreate,
    onDelete,
    onOpenDocuments,
}) {
    return (
        <div className="standard-page">
            <PageHeader
                eyebrow="WORKSPACE"
                title="Knowledge Bases"
                description="Organize private documents into searchable knowledge spaces."
                action={
                    <button
                        className="primary-button"
                        onClick={onCreate}
                    >
                        <Icon name="plus" />
                        New Knowledge Base
                    </button>
                }
            />

            {knowledgeBases.length === 0 ? (
                <EmptyState
                    icon="book"
                    title="No knowledge bases yet"
                    description="Create your first knowledge base and start adding documents."
                    button="Create Knowledge Base"
                    onClick={onCreate}
                />
            ) : (
                <div className="kb-grid">
                    {knowledgeBases.map((kb) => (
                        <div
                            className={`kb-card ${selectedKB?.id === kb.id
                                    ? "kb-card-active"
                                    : ""
                                }`}
                            key={kb.id}
                        >
                            <div className="kb-card-top">
                                <div className="large-kb-icon">
                                    <Icon name="database" size={24} />
                                </div>

                                <button
                                    className="icon-button"
                                    onClick={() => onDelete(kb.id)}
                                    title="Delete"
                                >
                                    <Icon name="trash" />
                                </button>
                            </div>

                            <h3>{kb.name}</h3>

                            <p>
                                {kb.description ||
                                    "Private knowledge collection"}
                            </p>

                            <div className="kb-card-footer">
                                <span>
                                    <Icon name="file" size={15} />
                                    Knowledge Base #{kb.id}
                                </span>

                                <button
                                    onClick={() => {
                                        setSelectedKB(kb);
                                        onOpenDocuments();
                                    }}
                                >
                                    Open →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DocumentsPage({
    selectedKB,
    documents,
    uploading,
    dragActive,
    setDragActive,
    onUpload,
    onFileSelect,
    onDelete,
    onReindex,
    fileInputRef,
    handleFileChange,
}) {
    return (
        <div className="standard-page">
            <PageHeader
                eyebrow="KNOWLEDGE"
                title="Documents"
                description={
                    selectedKB
                        ? `Documents inside ${selectedKB.name}`
                        : "Select a knowledge base to manage documents."
                }
            />

            {!selectedKB ? (
                <EmptyState
                    icon="database"
                    title="No Knowledge Base selected"
                    description="Create a knowledge base before uploading documents."
                />
            ) : (
                <>
                    <div
                        className={`upload-zone ${dragActive ? "drag-active" : ""
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                            setDragActive(false);

                            const files = Array.from(
                                e.dataTransfer.files || []
                            );

                            onUpload(files);
                        }}
                        onClick={onFileSelect}
                    >
                        <div className="upload-circle">
                            <Icon name="upload" size={28} />
                        </div>

                        <h3>
                            {uploading
                                ? "Uploading and processing..."
                                : "Drop your documents here"}
                        </h3>

                        <p>
                            or <span>browse files</span>
                        </p>

                        <small>
                            Supported: PDF · DOCX · TXT · Markdown · CSV
                        </small>

                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            multiple
                            accept=".pdf,.docx,.txt,.md,.csv"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="documents-panel">
                        <div className="documents-toolbar">
                            <div>
                                <h2>All Documents</h2>
                                <span>
                                    {documents.length} document
                                    {documents.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <button
                                className="secondary-button"
                                onClick={onFileSelect}
                            >
                                <Icon name="upload" />
                                Upload
                            </button>
                        </div>

                        {documents.length === 0 ? (
                            <EmptyDocuments />
                        ) : (
                            <div className="document-table">
                                <div className="table-header">
                                    <span>DOCUMENT</span>
                                    <span>STATUS</span>
                                    <span>TYPE</span>
                                    <span>ACTIONS</span>
                                </div>

                                {documents.map((doc) => (
                                    <div
                                        className="document-table-row"
                                        key={doc.id}
                                    >
                                        <div className="document-name">
                                            <div className="file-icon">
                                                <Icon name="file" size={19} />
                                            </div>

                                            <div>
                                                <strong>
                                                    {doc.filename ||
                                                        doc.original_filename ||
                                                        doc.name ||
                                                        `Document ${doc.id}`}
                                                </strong>

                                                <small>
                                                    {doc.size
                                                        ? formatBytes(doc.size)
                                                        : "Local document"}
                                                </small>
                                            </div>
                                        </div>

                                        <StatusBadge
                                            status={doc.status || "ready"}
                                        />

                                        <span className="file-type">
                                            {getExtension(
                                                doc.filename ||
                                                doc.original_filename ||
                                                doc.name ||
                                                ""
                                            )}
                                        </span>

                                        <div className="row-actions">
                                            <button
                                                className="small-action"
                                                title="Re-index"
                                                onClick={() =>
                                                    onReindex(doc.id)
                                                }
                                            >
                                                <Icon name="refresh" />
                                            </button>

                                            <button
                                                className="small-action danger"
                                                title="Delete"
                                                onClick={() =>
                                                    onDelete(doc.id)
                                                }
                                            >
                                                <Icon name="trash" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function ChatPage({
    selectedKB,
    messages,
    question,
    setQuestion,
    onAsk,
    loading,
    onSelectKB,
}) {
    const suggestions = [
        "Summarize the main points",
        "What are the key policies?",
        "What information is available?",
    ];

    return (
        <div className="chat-page">
            <div className="chat-header">
                <div>
                    <div className="eyebrow">
                        <span className="spark">✦</span>
                        LOCAL RAG CHAT
                    </div>

                    <h1>Ask your knowledge</h1>

                    <p>
                        Answers are generated only from your retrieved
                        local documents.
                    </p>
                </div>

                <div className="chat-kb">
                    <span className="status-dot"></span>
                    {selectedKB?.name || "No Knowledge Base"}
                </div>
            </div>

            <div className="chat-window">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="ai-symbol">✦</div>

                        <h2>How can I help?</h2>

                        <p>
                            Ask a question about the documents in your
                            active knowledge base.
                        </p>

                        <div className="suggestion-grid">
                            {suggestions.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setQuestion(item)}
                                >
                                    <span>{item}</span>
                                    <span>→</span>
                                </button>
                            ))}
                        </div>

                        {!selectedKB && (
                            <button
                                className="secondary-button"
                                onClick={onSelectKB}
                            >
                                Select Knowledge Base
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="messages">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.role === "user"
                                        ? "user-message"
                                        : "assistant-message"
                                    }`}
                            >
                                <div className="message-avatar">
                                    {message.role === "user"
                                        ? "You"
                                        : "✦"}
                                </div>

                                <div className="message-body">
                                    <div className="message-role">
                                        {message.role === "user"
                                            ? "You"
                                            : "AIMLCore"}
                                    </div>

                                    <div className="message-text">
                                        {message.content}
                                    </div>

                                    {message.sources?.length > 0 && (
                                        <div className="sources-box">
                                            <div className="sources-title">
                                                <Icon name="book" size={15} />
                                                Sources
                                            </div>

                                            {message.sources.map(
                                                (source, sourceIndex) => (
                                                    <div
                                                        className="source-item"
                                                        key={sourceIndex}
                                                    >
                                                        <div className="source-number">
                                                            {sourceIndex + 1}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {source.filename ||
                                                                    source.document_name ||
                                                                    source.name ||
                                                                    "Retrieved document"}
                                                            </strong>

                                                            <small>
                                                                {source.page
                                                                    ? `Page ${source.page}`
                                                                    : source.chunk_id
                                                                        ? `Chunk ${source.chunk_id}`
                                                                        : "Retrieved context"}
                                                            </small>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="message assistant-message">
                                <div className="message-avatar">✦</div>

                                <div className="message-body">
                                    <div className="message-role">
                                        AIMLCore
                                    </div>

                                    <div className="typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <form
                    className="chat-input-area"
                    onSubmit={onAsk}
                >
                    <input
                        value={question}
                        onChange={(e) =>
                            setQuestion(e.target.value)
                        }
                        placeholder={
                            selectedKB
                                ? "Ask anything about your documents..."
                                : "Select a Knowledge Base first..."
                        }
                        disabled={!selectedKB || loading}
                    />

                    <button
                        type="submit"
                        disabled={
                            !question.trim() ||
                            !selectedKB ||
                            loading
                        }
                    >
                        <Icon name="send" size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}

function SearchPage({ selectedKB, onSelectKB }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    async function performSearch(e) {
        e?.preventDefault();

        if (!query.trim() || !selectedKB) return;

        setSearching(true);

        try {
            const response = await fetch(
                `${API}/api/search?kb_id=${selectedKB.id}&query=${encodeURIComponent(
                    query
                )}`
            );

            const data = await response.json();

            setResults(
                Array.isArray(data)
                    ? data
                    : data.results || data.items || []
            );
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className="standard-page">
            <PageHeader
                eyebrow="RETRIEVAL"
                title="Semantic Search"
                description="Search your indexed knowledge base using vector similarity."
            />

            {!selectedKB ? (
                <EmptyState
                    icon="search"
                    title="Select a Knowledge Base"
                    description="Choose a knowledge base before searching."
                    button="Go to Knowledge Bases"
                    onClick={onSelectKB}
                />
            ) : (
                <>
                    <form
                        className="large-search"
                        onSubmit={performSearch}
                    >
                        <Icon name="search" size={23} />

                        <input
                            value={query}
                            onChange={(e) =>
                                setQuery(e.target.value)
                            }
                            placeholder="Search your knowledge..."
                        />

                        <button type="submit">
                            {searching ? "Searching..." : "Search"}
                        </button>
                    </form>

                    <div className="search-results">
                        {results.length === 0 ? (
                            <div className="search-empty">
                                <div>⌕</div>
                                <h3>No search results</h3>
                                <p>
                                    Enter a query to find relevant chunks.
                                </p>
                            </div>
                        ) : (
                            results.map((result, index) => (
                                <div
                                    className="result-card"
                                    key={index}
                                >
                                    <div className="result-top">
                                        <span className="result-number">
                                            {index + 1}
                                        </span>

                                        <strong>
                                            {result.filename ||
                                                result.document_name ||
                                                result.name ||
                                                "Retrieved document"}
                                        </strong>

                                        {result.score !== undefined && (
                                            <span className="score">
                                                {Number(result.score).toFixed(3)}
                                            </span>
                                        )}
                                    </div>

                                    <p>
                                        {result.text ||
                                            result.content ||
                                            result.chunk ||
                                            "No content available."}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function EvaluationPage() {
    return (
        <div className="standard-page">
            <PageHeader
                eyebrow="QUALITY"
                title="Evaluation"
                description="Measure retrieval and answer quality across your RAG pipeline."
            />

            <div className="evaluation-grid">
                <MetricCard
                    title="Recall @ K"
                    value="—"
                    description="Retrieval coverage"
                />

                <MetricCard
                    title="Hit @ K"
                    value="—"
                    description="Relevant result presence"
                />

                <MetricCard
                    title="Groundedness"
                    value="—"
                    description="Answer support from context"
                />

                <MetricCard
                    title="Answer Relevance"
                    value="—"
                    description="Question-answer relevance"
                />
            </div>

            <div className="evaluation-info">
                <div className="evaluation-icon">◫</div>

                <div>
                    <h3>Evaluation workspace</h3>

                    <p>
                        Add your 50+ evaluation questions and run the
                        evaluation script to populate these metrics.
                    </p>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    description,
}) {
    return (
        <div className="metric-card">
            <span>{title}</span>
            <strong>{value}</strong>
            <small>{description}</small>
        </div>
    );
}

function SettingsPage({
    backendOnline,
    models,
}) {
    return (
        <div className="standard-page">
            <PageHeader
                eyebrow="SYSTEM"
                title="Settings"
                description="Configure and monitor your local AI environment."
            />

            <div className="settings-grid">
                <div className="settings-card">
                    <div className="settings-card-icon">◉</div>

                    <div>
                        <span>Backend API</span>
                        <strong>
                            {backendOnline
                                ? "Connected"
                                : "Offline"}
                        </strong>
                    </div>

                    <span
                        className={`settings-indicator ${backendOnline ? "good" : "bad"
                            }`}
                    ></span>
                </div>

                <div className="settings-card">
                    <div className="settings-card-icon">✦</div>

                    <div>
                        <span>Ollama Model</span>
                        <strong>
                            {models[0]?.name || "llama3.2:3b"}
                        </strong>
                    </div>

                    <span className="settings-indicator good"></span>
                </div>

                <div className="settings-card">
                    <div className="settings-card-icon">◈</div>

                    <div>
                        <span>Architecture</span>
                        <strong>Local RAG</strong>
                    </div>
                </div>

                <div className="settings-card">
                    <div className="settings-card-icon">▤</div>

                    <div>
                        <span>Embeddings</span>
                        <strong>Sentence Transformers</strong>
                    </div>
                </div>
            </div>

            <div className="privacy-banner">
                <div className="privacy-icon">✓</div>

                <div>
                    <strong>Your data stays local.</strong>
                    <p>
                        AIMLCore processes documents and generates
                        responses using your local environment.
                    </p>
                </div>
            </div>
        </div>
    );
}

function PageHeader({
    eyebrow,
    title,
    description,
    action,
}) {
    return (
        <div className="page-header">
            <div>
                <span className="page-eyebrow">
                    {eyebrow}
                </span>

                <h1>{title}</h1>

                <p>{description}</p>
            </div>

            {action && <div>{action}</div>}
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
    button,
    onClick,
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                <Icon name={icon} size={28} />
            </div>

            <h2>{title}</h2>

            <p>{description}</p>

            {button && (
                <button
                    className="primary-button"
                    onClick={onClick}
                >
                    <Icon name="plus" />
                    {button}
                </button>
            )}
        </div>
    );
}

function EmptyDocuments() {
    return (
        <div className="empty-documents">
            <div className="empty-doc-icon">
                <Icon name="file" size={22} />
            </div>

            <div>
                <strong>No documents yet</strong>
                <span>
                    Upload documents to build your knowledge base.
                </span>
            </div>
        </div>
    );
}

function DocumentRow({ document }) {
    const filename =
        document.filename ||
        document.original_filename ||
        document.name ||
        `Document ${document.id}`;

    return (
        <div className="recent-document">
            <div className="file-icon">
                <Icon name="file" size={18} />
            </div>

            <div className="recent-document-name">
                <strong>{filename}</strong>
                <small>
                    {document.status || "Ready"}
                </small>
            </div>

            <StatusBadge
                status={document.status || "ready"}
            />
        </div>
    );
}

function StatusBadge({ status }) {
    const normalized = String(status)
        .toLowerCase()
        .replaceAll("_", " ");

    let className = "status-ready";

    if (
        normalized.includes("process") ||
        normalized.includes("pending")
    ) {
        className = "status-processing";
    }

    if (
        normalized.includes("fail") ||
        normalized.includes("error")
    ) {
        className = "status-failed";
    }

    return (
        <span className={`status-badge ${className}`}>
            <span></span>
            {normalized}
        </span>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <span>NEW WORKSPACE</span>
                        <h2>{title}</h2>
                    </div>

                    <button
                        className="modal-close"
                        onClick={onClose}
                    >
                        <Icon name="close" size={23} />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

function pageTitle(page) {
    const titles = {
        dashboard: "Dashboard",
        knowledge: "Knowledge Bases",
        documents: "Documents",
        chat: "AI Chat",
        search: "Semantic Search",
        evaluation: "Evaluation",
        settings: "Settings",
    };

    return titles[page] || "Dashboard";
}

function formatBytes(bytes) {
    if (!bytes) return "";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
        1
    )} ${units[index]}`;
}

function getExtension(filename) {
    const parts = filename.split(".");

    if (parts.length < 2) return "FILE";

    return parts.pop().toUpperCase();
}

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);